output "id" {
  value = azurerm_cognitive_account.foundry.id
}

output "name" {
  value = azurerm_cognitive_account.foundry.name
}

output "endpoint" {
  # kind="AIServices" 계정에서는 cognitiveservices.azure.com, openai.azure.com 도메인 모두
  # OpenAI Chat Completions REST 경로(/openai/deployments/.../chat/completions)를 라우팅하지 못하고
  # 순수 404를 반환한다(RBAC 단계까지 가지도 못함). 실제로 라우팅되는 도메인은
  # services.ai.azure.com (Azure AI Foundry 통합 엔드포인트) 뿐이다 - REST로 직접 검증 완료.
  value = "https://${azurerm_cognitive_account.foundry.custom_subdomain_name}.services.ai.azure.com/"
}

output "principal_id" {
  description = "Foundry 계정의 System Assigned Identity principal id"
  value       = azurerm_cognitive_account.foundry.identity[0].principal_id
}

output "deployment_names" {
  value = [for d in azurerm_cognitive_deployment.this : d.name]
}

output "primary_access_key" {
  value     = azurerm_cognitive_account.foundry.primary_access_key
  sensitive = true
}
