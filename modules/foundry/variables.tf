variable "name" {
  type = string
}

variable "resource_group_name" {
  type = string
}

variable "location" {
  type = string
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "firewall_allowed_ip_rules" {
  description = "Cognitive Account 방화벽(network_acls)에서 허용할 공인 IP CIDR 목록. 비어있으면 network_acls를 설정하지 않음(기본값 = 전체 네트워크 허용)"
  type        = list(string)
  default     = []
}

variable "model_deployments" {
  description = "Foundry(Cognitive Account)에 배포할 OpenAI 모델 목록. 키가 배포(deployment) 이름이 됩니다."
  type = map(object({
    model_name             = string
    model_version          = string
    sku_name               = optional(string, "GlobalStandard")
    capacity               = optional(number, 10)
    version_upgrade_option = optional(string, "OnceCurrentVersionExpired")
  }))

  default = {
    "gpt-5.6" = {
      model_name    = "gpt-5.6"
      model_version = "2026-07-09"
    }
  }
}
