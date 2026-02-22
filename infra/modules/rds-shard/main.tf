# ─── Parameter Group ──────────────────────────────────────────────────────────

resource "aws_db_parameter_group" "shard" {
  name   = "${var.project_name}-${var.environment}-shard-${var.shard_index}-pg"
  family = "postgres16"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "log_statement"
    value = "ddl"
  }

  # Replication settings for read replicas
  parameter {
    name  = "rds.logical_replication"
    value = "1"
    apply_method = "pending-reboot"
  }

  tags = merge(var.tags, {
    Name  = "${var.project_name}-shard-${var.shard_index}-pg"
    Shard = var.shard_index
  })
}

# ─── Primary Instance ────────────────────────────────────────────────────────

resource "aws_db_instance" "primary" {
  identifier = "${var.project_name}-${var.environment}-shard-${var.shard_index}-primary"

  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.db_instance_class

  allocated_storage     = var.allocated_storage
  max_allocated_storage = var.max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = var.vpc_security_group_ids
  parameter_group_name   = aws_db_parameter_group.shard.name

  multi_az            = var.multi_az
  publicly_accessible = false

  backup_retention_period = var.backup_retention_period
  backup_window           = "03:00-04:00"
  maintenance_window      = "sun:04:30-sun:05:30"

  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.project_name}-shard-${var.shard_index}-final" : null
  deletion_protection       = var.environment == "prod"

  performance_insights_enabled = true

  tags = merge(var.tags, {
    Name  = "${var.project_name}-shard-${var.shard_index}-primary"
    Role  = "primary"
    Shard = var.shard_index
  })
}

# ─── Read Replicas ───────────────────────────────────────────────────────────

resource "aws_db_instance" "read_replica" {
  count = var.read_replica_count

  identifier = "${var.project_name}-${var.environment}-shard-${var.shard_index}-replica-${count.index}"

  replicate_source_db = aws_db_instance.primary.identifier

  engine         = "postgres"
  engine_version = var.engine_version
  instance_class = var.db_instance_class

  storage_encrypted = true

  vpc_security_group_ids = var.vpc_security_group_ids
  parameter_group_name   = aws_db_parameter_group.shard.name

  multi_az            = false
  publicly_accessible = false

  skip_final_snapshot = true

  performance_insights_enabled = true

  tags = merge(var.tags, {
    Name         = "${var.project_name}-shard-${var.shard_index}-replica-${count.index}"
    Role         = "replica"
    Shard        = var.shard_index
    ReplicaIndex = count.index
  })
}
