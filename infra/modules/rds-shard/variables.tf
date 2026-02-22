variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "shard_index" {
  description = "Index of this shard (0, 1, 2...)"
  type        = number
}

variable "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  type        = string
}

variable "vpc_security_group_ids" {
  description = "Security group IDs for the RDS instances"
  type        = list(string)
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "engine_version" {
  type    = string
  default = "16.4"
}

variable "allocated_storage" {
  type    = number
  default = 20
}

variable "max_allocated_storage" {
  type    = number
  default = 100
}

variable "db_name" {
  type    = string
  default = "app_db"
}

variable "db_username" {
  type    = string
  default = "postgres"
}

variable "db_password" {
  description = "Master password for this shard's primary instance"
  type        = string
  sensitive   = true
}

variable "read_replica_count" {
  description = "Number of read replicas for this shard"
  type        = number
  default     = 1
}

variable "backup_retention_period" {
  type    = number
  default = 7
}

variable "multi_az" {
  type    = bool
  default = false
}

variable "tags" {
  type    = map(string)
  default = {}
}
