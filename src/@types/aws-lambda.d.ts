declare namespace AWSLambda {
  export interface Request {
    version: string;
    routeKey: string;
    rawPath: string;
    rawQueryString: string;
    headers: Record<string, string>;
    requestContext: {
      accountId: string;
      apiId: string;
      domainName: string;
      domainPrefix: string;
      http: {
        method: string;
        path: string;
        protocol: string;
        sourceIp: string;
        userAgent: string;
      };
      requestId: string;
      routeKey: string;
      stage: string;
      time: string;
      timeEpoch: number;
    };
    pathParameters?: Record<string, string>;
    isBase64Encoded: false;
  }

  export interface Request {
    version: string;
    routeKey: string;
    rawPath: string;
    rawQueryString: string;
    headers: Record<string, string>;
    requestContext: {
      accountId: string;
      apiId: string;
      domainName: string;
      domainPrefix: string;
      http: {
        method: string;
        path: string;
        protocol: string;
        sourceIp: string;
        userAgent: string;
      };
      requestId: string;
      routeKey: string;
      stage: string;
      time: string;
      timeEpoch: number;
    };
    pathParameters?: Record<string, string>;
    isBase64Encoded: false;
  }

  export interface Response {
    statusCode: number;
    body?: string;
    headers?: Record<string, string>;
    isBase64Encoded?: boolean;
  }
}

declare module "aws-lambda" {
  export = AWSLambda;
}
