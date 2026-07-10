data "aws_iam_policy_document" "lambda_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_exec" {
  name               = "peerreview-lambda-exec"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume.json
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_exec.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "lambda_dynamodb" {
  statement {
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:TransactWriteItems",
    ]
    resources = [
      aws_dynamodb_table.users.arn,
      "${aws_dynamodb_table.users.arn}/index/*",
      aws_dynamodb_table.products.arn,
      "${aws_dynamodb_table.products.arn}/index/*",
      aws_dynamodb_table.assignments.arn,
      "${aws_dynamodb_table.assignments.arn}/index/*",
    ]
  }
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name   = "peerreview-lambda-dynamodb"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_dynamodb.json
}

# incoming (verify) fires the matcher asynchronously
data "aws_iam_policy_document" "lambda_invoke_matcher" {
  statement {
    actions   = ["lambda:InvokeFunction"]
    resources = ["arn:aws:lambda:${var.aws_region}:${var.aws_account_id}:function:peerreview-matcher"]
  }
}

resource "aws_iam_role_policy" "lambda_invoke_matcher" {
  name   = "peerreview-lambda-invoke-matcher"
  role   = aws_iam_role.lambda_exec.id
  policy = data.aws_iam_policy_document.lambda_invoke_matcher.json
}
