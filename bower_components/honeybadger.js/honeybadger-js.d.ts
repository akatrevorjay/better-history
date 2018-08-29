declare module "honeybadger-js" {
    interface Config {
        debug?: boolean;
        apiKey: string;
        revision?: string;
        host?: string;
        ssl?: boolean;
        projectRoot?: string;
        environment?: string;
        component?: string;
        action?: string;
        onerror?: boolean;
        disabled?: boolean;
        ignorePatterns?: RegExp[];
        async?: boolean;
    }

    interface Notice {
        stack: any;
        name: string;
        message: string;
        url: string;
        project_root: string;
        environment: string;
        component: string;
        action: string;
        fingerprint: string;
        context: any;
    }

    class Honeybadger {
        static configure(config: Config): void;
        static notify(...args: any[]): void;
        static wrap<T extends Function>(func: T): T;
        static setContext<T extends Object>(context: T): void;
        static resetContext(): void;
        static beforeNotify(func: (notice?: Notice) => void): void;
        static factory(config: Config): Honeybadger;
    }

    namespace Honeybadger {}
    export = Honeybadger;
}
