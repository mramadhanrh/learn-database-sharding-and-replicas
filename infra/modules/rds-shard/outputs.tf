output "primary_endpoint" {
  description = "Writer endpoint of the shard's primary instance"
  value       = aws_db_instance.primary.address
}

output "primary_port" {
  description = "Port of the primary instance"
  value       = aws_db_instance.primary.port
}

output "primary_arn" {
  description = "ARN of the primary instance"
  value       = aws_db_instance.primary.arn
}

output "replica_endpoints" {
  description = "Reader endpoints of the shard's read replicas"
  value       = [for r in aws_db_instance.read_replica : r.address]
}

output "replica_arns" {
  description = "ARNs of the shard's read replicas"
  value       = [for r in aws_db_instance.read_replica : r.arn]
}

output "shard_index" {
  value = var.shard_index
}
