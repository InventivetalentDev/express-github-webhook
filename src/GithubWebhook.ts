import { DEFAULT_OPTIONS, WebhookOptions } from "./WebhookOptions";
import { Request, Response, NextFunction, RequestHandler, Application } from "express";
import { PathParams } from "express-serve-static-core";
import * as crypto from "crypto";
import { GithubBody, GithubHeaders } from "./Github";

const TAG = "[GitHub] ";

export class GithubWebhook {

    private readonly _options: WebhookOptions;

    constructor(options: WebhookOptions) {
        this._options = { ...DEFAULT_OPTIONS, ...options };
    }

    get options(): WebhookOptions {
        return { ...this._options };
    }

    get middleware(): RequestHandler {
        return (req: Request, res: Response, next: NextFunction) => {
            if (this.isValidRequest(req, res)) next();
        };
    }

    addTo(app: Application, path: PathParams): Application {
        return app.use(path, this.middleware);
    }

    //// REQUEST STUFF

    // OPTION CHECKS

    protected isValidRequest(req: Request, res: Response): boolean {
        if (!this.validateRequest(req, res)) {
            return false;
        }

        const body = req.body as GithubBody;
        const headers = req.headers as GithubHeaders;

        if (!this.shouldHandleEvent(body, headers, req)) {
            res.status(200).send();
            return false;
        }
        if (!this.shouldHandleRef(body, headers, req)) {
            res.status(200).send();
            return false;
        }
        if (!this.shouldHandlePusher(body, headers, req)) {
            res.status(200).send();
            return false;
        }
        if (!this.shouldHandleCommit(body, headers, req)) {
            res.status(200).send();
            return false;
        }

        if (!this.validateSignature(body, headers, req)) {
            res.status(401).send("invalid signature");
            console.warn(TAG + "Received webhook request with invalid signature");
            return false;
        }

        return true;
    }

    protected shouldHandleEvent(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        if (this._options.events.length <= 0) return false;
        if (this._options.events[0] === "*") return true;
        const event = headers["x-github-event"] as string;
        return this._options.events.includes(event);
    }

    protected shouldHandleRef(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        if (this._options.branches.length <= 0) return false;
        if (this._options.branches[0] === "*") return true;
        if (this._options.onlyTags) {
            // body.ref has tag/head info
            if (!body.ref.startsWith("refs\/tags\/")) return false; // not a tag
        }
        // body.base_ref exists if there's a tag in body.ref
        if (!body.ref && !body.base_ref) return false;
        const branch = (body.base_ref || body.ref).replace(/refs\/heads\//, "");
        return this._options.branches.includes(branch.trim());
    }

    protected shouldHandlePusher(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        if (!this._options.pusherIgnoreRegex) return true;
        if (!body.pusher) return true;
        if (body.pusher.name && this._options.pusherIgnoreRegex.test(body.pusher.name)) {
            // ignored
            return false;
        }
        return true;
    }

    protected shouldHandleCommit(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        if (!this._options.commitIgnoreRegex) return true;
        if (!body.head_commit && !body.commits) return true;
        const commit = body.head_commit || body.commits[0];
        if (commit && this._options.commitIgnoreRegex.test(commit.message)) {
            // ignore
            return false;
        }
        return true;
    }

    // VALIDATIONS

    protected validateSignature(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        if (!this._options.secret || this._options.secret.length <= 0) return true; // no secret configured
        const signature = headers["x-hub-signature"] as string;
        if (!signature || signature.length <= 0) return false;
        // validate signature (https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428)
        const bodyStr = JSON.stringify(req.body);
        const hmac = crypto.createHmac('sha1', this._options.secret);
        const digest = Buffer.from("sha1=" + hmac.update(bodyStr).digest('hex'), 'utf8');
        const checksum = Buffer.from(signature, 'utf8');
        if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
            console.warn(TAG + "Received webhook request with invalid signature (Body " + digest + " did not match header " + checksum + ")");
            return false;
        }
        return true;
    }

    protected validateRequest(req: Request, res: Response): boolean {
        if (req.method.toLowerCase() !== "post") {
            res.status(400).send("invalid request method");
            return false;
        }
        if (!req.headers["user-agent"] || req.headers["user-agent"].length <= 0) {
            res.status(400).send("missing user agent header");
            return false;
        }
        if (!req.headers["user-agent"].startsWith("GitHub-Hookshot/")) {
            res.status(400).send("invalid user agent");
            return false;
        }
        if (!req.headers["x-hub-signature"] || req.headers["x-hub-signature"].length <= 0) {
            res.status(400).send("missing request signature");
            return false;
        }
        if (!req.headers["x-github-event"] || req.headers["x-github-event"].length <= 0) {
            res.status(400).send("missing event");
            return false;
        }
        if (!req.body || req.body.length <= 0) {
            res.status(400).send("missing body");
            return false;
        }
        return true;
    }

}
