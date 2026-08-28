export function adapt(handler) {
  return async (context) => {
    const { request, env } = context;

    if (env) {
      for (const [key, value] of Object.entries(env)) {
        if (typeof value === 'string' && process.env[key] === undefined) {
          process.env[key] = value;
        }
      }
    }

    const url = new URL(request.url);
    const headers = {};
    for (const [key, value] of request.headers.entries()) {
      headers[key.toLowerCase()] = value;
    }

    const req = {
      method: request.method,
      headers,
      query: Object.fromEntries(url.searchParams),
      body: null,
    };

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      const contentType = headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        req.body = await request.json().catch(() => ({}));
      }
    }

    return new Promise((resolve, reject) => {
      const res = {
        statusCode: 200,
        headers: {},
        status(code) {
          this.statusCode = code;
          return this;
        },
        setHeader(key, value) {
          this.headers[key] = value;
          return this;
        },
        json(data) {
          resolve(new Response(JSON.stringify(data), {
            status: this.statusCode,
            headers: {
              'Content-Type': 'application/json',
              ...this.headers,
            },
          }));
          return this;
        },
        send(body) {
          resolve(new Response(body, {
            status: this.statusCode,
            headers: this.headers,
          }));
          return this;
        },
        end(body) {
          resolve(new Response(body ?? null, {
            status: this.statusCode,
            headers: this.headers,
          }));
          return this;
        },
      };

      Promise.resolve(handler(req, res)).catch(reject);
    });
  };
}
