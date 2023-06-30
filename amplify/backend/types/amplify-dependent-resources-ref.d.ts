export type AmplifyDependentResourcesAttributes = {
  "api": {
    "pdf": {
      "ApiId": "string",
      "ApiName": "string",
      "RootUrl": "string"
    }
  },
  "function": {
    "urlToPdf": {
      "Arn": "string",
      "LambdaExecutionRole": "string",
      "LambdaExecutionRoleArn": "string",
      "Name": "string",
      "Region": "string"
    },
    "urltopdfappDependencies": {
      "Arn": "string"
    }
  }
}