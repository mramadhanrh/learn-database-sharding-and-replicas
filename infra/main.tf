terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

# ═════════════════════════════════════════════════════════════════════════════
# VPC & NETWORKING
# ═════════════════════════════════════════════════════════════════════════════

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "${local.name_prefix}-vpc" }
}

# ─── Internet Gateway (for public subnets) ───────────────────────────────────

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name_prefix}-igw" }
}

# ─── Public Subnets ──────────────────────────────────────────────────────────

resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = { Name = "${local.name_prefix}-public-${var.availability_zones[count.index]}" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${local.name_prefix}-public-rt" }
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# ─── Private Subnets (for RDS) ──────────────────────────────────────────────

resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]

  tags = { Name = "${local.name_prefix}-private-${var.availability_zones[count.index]}" }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "${local.name_prefix}-private-rt" }
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# ─── DB Subnet Group ────────────────────────────────────────────────────────

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet"
  subnet_ids = aws_subnet.private[*].id

  tags = { Name = "${local.name_prefix}-db-subnet-group" }
}

# ─── Security Group for RDS ─────────────────────────────────────────────────

resource "aws_security_group" "rds" {
  name_prefix = "${local.name_prefix}-rds-"
  description = "Allow PostgreSQL traffic from app subnets"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "PostgreSQL from app subnets"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = var.app_cidr_blocks
  }

  # Allow replicas to talk to primary within VPC
  ingress {
    description = "PostgreSQL replication within VPC"
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "${local.name_prefix}-rds-sg" }

  lifecycle {
    create_before_destroy = true
  }
}

# ═════════════════════════════════════════════════════════════════════════════
# SECRETS MANAGER — one password per shard
# ═════════════════════════════════════════════════════════════════════════════

resource "random_password" "shard_password" {
  count   = var.shard_count
  length  = 32
  special = false # RDS doesn't allow some special chars
}

resource "aws_secretsmanager_secret" "shard_password" {
  count = var.shard_count

  name        = "${local.name_prefix}/rds/shard-${count.index}/password"
  description = "Master password for shard ${count.index}"

  tags = { Shard = count.index }
}

resource "aws_secretsmanager_secret_version" "shard_password" {
  count = var.shard_count

  secret_id     = aws_secretsmanager_secret.shard_password[count.index].id
  secret_string = random_password.shard_password[count.index].result
}

# ═════════════════════════════════════════════════════════════════════════════
# RDS SHARDS — each shard = 1 primary + N read replicas
# ═════════════════════════════════════════════════════════════════════════════

module "shard" {
  source = "./modules/rds-shard"
  count  = var.shard_count

  project_name = var.project_name
  environment  = var.environment
  shard_index  = count.index

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  db_instance_class     = var.db_instance_class
  engine_version        = var.db_engine_version
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage

  db_name     = var.db_name
  db_username = var.db_username
  db_password = random_password.shard_password[count.index].result

  read_replica_count = var.read_replica_count

  tags = {
    Shard = count.index
  }
}

# ═════════════════════════════════════════════════════════════════════════════
# SHARD MAP — stored in Secrets Manager as JSON for the app to consume
# ═════════════════════════════════════════════════════════════════════════════

resource "aws_secretsmanager_secret" "shard_map" {
  name        = "${local.name_prefix}/rds/shard-map"
  description = "JSON shard map with writer/reader endpoints for all shards"
}

resource "aws_secretsmanager_secret_version" "shard_map" {
  secret_id = aws_secretsmanager_secret.shard_map.id

  secret_string = jsonencode({
    shard_count = var.shard_count
    db_name     = var.db_name
    db_port     = 5432
    db_user     = var.db_username
    shards = [
      for i in range(var.shard_count) : {
        index           = i
        write_host      = module.shard[i].primary_endpoint
        read_hosts      = module.shard[i].replica_endpoints
        password_secret = aws_secretsmanager_secret.shard_password[i].arn
      }
    ]
  })
}
