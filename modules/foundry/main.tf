# Azure AI Foundry (Cognitive Services "AIServices" 계정) + 모델 배포
# 개인 학습용 구성이라 Private Endpoint 없이 공개 엔드포인트로 생성한다.
# firewall_allowed_ip_rules를 지정하면 해당 IP만 허용하도록 방화벽을 켤 수 있다(기본값 = 전체 허용).

resource "azurerm_cognitive_account" "foundry" {
  name                = var.name
  location            = var.location
  resource_group_name = var.resource_group_name
  kind                = "AIServices"

  sku_name              = "S0"
  custom_subdomain_name = var.name
  tags                  = var.tags

  # Web App의 System Assigned Identity로 (API Key 없이) 접근하기 위해 필요.
  identity {
    type = "SystemAssigned"
  }

  dynamic "network_acls" {
    for_each = length(var.firewall_allowed_ip_rules) > 0 ? [1] : []
    content {
      default_action = "Deny"
      bypass         = "AzureServices"
      ip_rules       = var.firewall_allowed_ip_rules
    }
  }
}

resource "azurerm_cognitive_deployment" "this" {
  for_each = var.model_deployments

  name                 = each.key
  cognitive_account_id = azurerm_cognitive_account.foundry.id

  model {
    format  = "OpenAI"
    name    = each.value.model_name
    version = each.value.model_version
  }

  version_upgrade_option = each.value.version_upgrade_option

  sku {
    name     = each.value.sku_name
    capacity = each.value.capacity
  }
}
