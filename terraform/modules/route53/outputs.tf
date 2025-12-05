output "zone_id" {
  description = "ID da hosted zone Route53"
  value       = aws_route53_zone.main.zone_id
}

output "zone_name" {
  description = "Nome da hosted zone"
  value       = aws_route53_zone.main.name
}

output "name_servers" {
  description = "Nameservers do Route53"
  value       = aws_route53_zone.main.name_servers
}
