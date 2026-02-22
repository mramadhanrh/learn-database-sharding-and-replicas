# ═════════════════════════════════════════════════════════════════════════════
# VPC
# ═════════════════════════════════════════════════════════════════════════════

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs (RDS)"
  value       = aws_subnet.private[*].id
}

output "public_subnet_ids" {
  description = "Public subnet IDs (app / bastion)"
  value       = aws_subnet.public[*].id
}

# ═════════════════════════════════════════════════════════════════════════════
# RDS SHARD ENDPOINTS — for direct use
# ═════════════════════════════════════════════════════════════════════════════

output "shard_writer_endpoints" {
  description = "Writer endpoint for each shard"
  value = {
    for i in range(var.shard_count) :
    "shard_${i}" => module.shard[i].primary_endpoint
  }
}

output "shard_reader_endpoints" {
  description = "Reader endpoints for each shard"
  value = {
    for i in range(var.shard_count) :
    "shard_${i}" => module.shard[i].replica_endpoints
  }
}

# ═════════════════════════════════════════════════════════════════════════════
# SECRETS
# ═════════════════════════════════════════════════════════════════════════════

output "shard_password_secret_arns" {
  description = "ARN of each shard's password secret"
  value       = aws_secretsmanager_secret.shard_password[*].arn
  sensitive   = true
}

output "shard_map_secret_arn" {
  description = "ARN of the shard map secret"
  value       = aws_secretsmanager_secret.shard_map.arn
}

# ═════════════════════════════════════════════════════════════════════════════
# ENV VARS — ready to paste into .env or ECS task definitions
# ═════════════════════════════════════════════════════════════════════════════

output "app_env_vars" {
  description = "Environment variables for the Express app (non-sensitive)"
  value = merge(
    {
      DB_SHARD_COUNT = tostring(var.shard_count)
      DB_NAME        = var.db_name
      DB_PORT        = "5432"
      DB_USER        = var.db_username
    },
    {
      for i in range(var.shard_count) :
      "DB_SHARD_${i}_WRITE_HOST" => module.shard[i].primary_endpoint
    },
    {
      for i in range(var.shard_count) :
      "DB_SHARD_${i}_READ_HOST" => join(",", module.shard[i].replica_endpoints)
    }
  )
}
