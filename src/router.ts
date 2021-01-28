import type { Context, Request, Response } from "aws-lambda";
import { match, MatchFunction } from "path-to-regexp";
import { forbidden } from "./response";

type Middleware = (response: Response) => Response;
type RouteParams = Record<string, string>;
type Handler = (params: RouteParams, event: Request, context: Context) => Promise<Response>;
type Route = {
  method: string;
  route: string;
  match: MatchFunction<object>;
  handler: Handler;
};

const DEFAULT_ROUTE: Pick<Route, "handler"> = {
  handler: () => Promise.resolve(forbidden()),
};

export class Router {
  private readonly _middlewares: Middleware[] = [];
  private readonly _routes: Route[] = [];

  constructor() {
    this.handler = this.handler.bind(this);
  }

  /**
   * Register a response middleware
   * @param middleware the middleware function
   */
  use(middleware: Middleware): this {
    this._middlewares.push(middleware);
    return this;
  }

  /**
   * Register a GET route handler
   *
   * @param route the route pattern
   * @param handler the route handler
   */
  get(route: string, handler: Handler): this {
    this._routes.push({
      method: "GET",
      route,
      match: match(route, { decode: decodeURIComponent }),
      handler,
    });

    return this;
  }

  /**
   * Handle a lambda request
   *
   * @param event the request event
   * @param context the request context
   */
  async handler(event: Request, context: Context): Promise<Response> {
    const { rawPath: path } = event;
    const { method } = event.requestContext.http;

    // find and invoke route
    const { route, params } = this._findRoute(path, method);
    let response = await route.handler(params, event, context);

    // invoke middlewares
    return this._middlewares.reduce((response, middleware) => middleware(response), response);
  }

  private _findRoute(path: string, method: string) {
    method = method.toUpperCase();
    for (const route of this._routes) {
      const result = route.method === method && route.match(path);
      if (typeof result === "object") {
        return { route, params: result.params };
      }
    }

    return { route: DEFAULT_ROUTE, params: {} };
  }
}
