variable "scope" {
  description = "역할을 부여할 대상 리소스의 ID"
  type        = string
}

variable "role_definition_name" {
  description = "부여할 내장 역할 이름 (예: Cognitive Services OpenAI User)"
  type        = string
}

variable "principal_id" {
  description = "역할을 받을 주체(Managed Identity 등)의 Object ID"
  type        = string
}
