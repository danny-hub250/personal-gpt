provider "azurerm" {
  features {}

  subscription_id = "a91975d8-17fa-48c4-bd6c-84dedd863785" # personal-gpt

  # tenant_id는 지정하지 않음 - `az login`으로 로그인된 계정의 기본 테넌트를 사용한다.
  # 여러 테넌트를 사용 중이라면 아래 주석을 해제하고 값을 채워서 사용할 것.
  # tenant_id = ""
}
