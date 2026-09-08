output "id" {
  value = azurerm_cognitive_account.foundry.id
}

output "name" {
  value = azurerm_cognitive_account.foundry.name
}

output "endpoint" {
  value = azurerm_cognitive_account.foundry.endpoint
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
