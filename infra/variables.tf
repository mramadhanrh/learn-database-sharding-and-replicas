variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-1"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "learn-sharding"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# ─── VPC ─────────────────────────────────────────────────────────────────────

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "availability_zones" {
  description = "List of AZs to use"
  type        = list(string)
  default     = ["ap-southeast-1a", "ap-southeast-1b"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets (database)"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.11.0/24"]
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (app / bastion)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

# ─── RDS ─────────────────────────────────────────────────────────────────────

variable "shard_count" {
  description = "Number of database shards"
  type        = number
  default     = 2
}

variable "read_replica_count" {
  description = "Number of read replicas per shard"
  type        = number
  default     = 1
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_engine_version" {
  description = "PostgreSQL engine version"
  type        = string
  default     = "16.4"
}

variable "db_allocated_storage" {
  description = "Allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "Max allocated storage in GB for autoscaling"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "app_db"
}

variable "db_username" {
  description = "Master username for RDS"
  type        = string
  default     = "postgres"
}

variable "app_cidr_blocks" {
  description = "CIDR blocks allowed to connect to the database"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}
