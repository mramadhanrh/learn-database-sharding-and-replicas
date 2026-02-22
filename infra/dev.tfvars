aws_region   = "ap-southeast-1"
project_name = "learn-sharding"
environment  = "dev"

vpc_cidr             = "10.0.0.0/16"
availability_zones   = ["ap-southeast-1a", "ap-southeast-1b"]
private_subnet_cidrs = ["10.0.10.0/24", "10.0.11.0/24"]
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]

shard_count       = 2
read_replica_count = 1

db_instance_class        = "db.t3.micro"
db_engine_version        = "16.4"
db_allocated_storage     = 20
db_max_allocated_storage = 100
db_name                  = "app_db"
db_username              = "postgres"

app_cidr_blocks = ["10.0.1.0/24", "10.0.2.0/24"]
