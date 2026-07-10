locals {
  common_env = {
    USERS_TABLE       = aws_dynamodb_table.users.name
    PRODUCTS_TABLE    = aws_dynamodb_table.products.name
    ASSIGNMENTS_TABLE = aws_dynamodb_table.assignments.name
    REGION            = var.aws_region
  }

  # one entry per lambda dir under ../lambda/
  functions = {
    me          = {}
    products    = {}
    assignment  = {}
    incoming    = { env = { MATCHER_FUNCTION = "peerreview-matcher" } }
    member      = {}
    leaderboard = {}
    matcher     = {}
    webhook-payment = {
      env = { LEMONSQUEEZY_WEBHOOK_SECRET = var.lemonsqueezy_webhook_secret }
    }
  }
}

data "archive_file" "fn" {
  for_each    = local.functions
  type        = "zip"
  source_dir  = "${path.module}/../lambda/${each.key}"
  output_path = "${path.module}/../lambda/${each.key}.zip"
}

resource "aws_lambda_function" "fn" {
  for_each = local.functions

  function_name    = "peerreview-${each.key}"
  runtime          = "nodejs22.x"
  handler          = "index.handler"
  role             = aws_iam_role.lambda_exec.arn
  filename         = data.archive_file.fn[each.key].output_path
  source_code_hash = data.archive_file.fn[each.key].output_base64sha256
  timeout          = each.key == "matcher" ? 60 : 10
  memory_size      = 128

  environment {
    variables = merge(local.common_env, try(each.value.env, {}))
  }
}

resource "aws_lambda_function_event_invoke_config" "no_retry" {
  for_each               = local.functions
  function_name          = aws_lambda_function.fn[each.key].function_name
  maximum_retry_attempts = 0
}

# Hourly matcher run: assigns queued products, expires overdue assignments
resource "aws_cloudwatch_event_rule" "matcher_hourly" {
  name                = "peerreview-matcher-hourly"
  schedule_expression = "rate(1 hour)"
}

resource "aws_cloudwatch_event_target" "matcher_hourly" {
  rule = aws_cloudwatch_event_rule.matcher_hourly.name
  arn  = aws_lambda_function.fn["matcher"].arn
}

resource "aws_lambda_permission" "matcher_events" {
  statement_id  = "AllowEventBridgeInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.fn["matcher"].function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.matcher_hourly.arn
}
