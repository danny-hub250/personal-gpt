output "webapp_url" {
  description = "채팅 웹페이지 URL"
  value       = "https://${module.webapp.default_hostname}"
}

output "foundry_endpoint" {
  description = "Azure AI Foundry(Azure OpenAI) 엔드포인트"
  value       = module.foundry.endpoint
}

output "foundry_deployment_names" {
  description = "배포된 모델(deployment) 이름 목록"
  value       = module.foundry.deployment_names
}

output "webapp_principal_id" {
  description = "Web App System Assigned Identity principal id (역할 확인용)"
  value       = module.webapp.principal_id
}
