// Type declarations for PayPal SDK
declare module '@paypal/checkout-server-sdk' {
  export class Environment {
    static Sandbox: new (clientId: string, clientSecret: string) => Environment;
  }

  export class PayPalApi {
    constructor(environment: Environment);
    Orders: {
      OrdersCreateRequest: new () => any;
      OrdersCaptureRequest: new (orderId: string) => any;
    };
    Payments: {
      CapturesRefundRequest: new (captureId: string) => any;
    };
    execute: (request: any) => Promise<any>;
  }

  export namespace PayPalApi {
    export class Environment {
      static Sandbox: new (
        clientId: string,
        clientSecret: string
      ) => Environment;
    }
    export class Orders {
      static OrdersCreateRequest: new () => any;
      static OrdersCaptureRequest: new (orderId: string) => any;
    }
    export class Payments {
      static CapturesRefundRequest: new (captureId: string) => any;
    }
  }
}
