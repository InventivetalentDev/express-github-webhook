import { should } from 'chai';
import { Request, Response, NextFunction, RequestHandler, Application } from "express";
import { PathParams } from "express-serve-static-core";
import { GithubWebhook, WebhookOptions, GithubBody, GithubHeaders  } from "../src";

should();

class PublicWebhook extends GithubWebhook {

    constructor(options: WebhookOptions) {
        super(options);
    }

    get options(): WebhookOptions {
        return super.options;
    }

    get middleware(): RequestHandler {
        return super.middleware;
    }

    addTo(app: Application, path: PathParams): Application {
        return super.addTo(app, path);
    }

    isValidRequest(req: Request, res: Response): boolean {
        return super.isValidRequest(req, res);
    }

    shouldHandleEvent(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        return super.shouldHandleEvent(body, headers, req);
    }

    shouldHandleRef(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        return super.shouldHandleRef(body, headers, req);
    }

    shouldHandlePusher(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        return super.shouldHandlePusher(body, headers, req);
    }

    shouldHandleCommit(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        return super.shouldHandleCommit(body, headers, req);
    }

    validateSignature(body: GithubBody, headers: GithubHeaders, req: Request): boolean {
        return super.validateSignature(body, headers, req);
    }

    validateRequest(req: Request, res: Response): boolean {
        return super.validateRequest(req, res);
    }
}


describe("Checks", function () {
    let puller = new PublicWebhook({
        secret: "idunno",
        events: ["push"],
        branches: ["main"],
        onlyTags: true,
    });
    describe("#events", function () {
        it("should handle only 'push' events", function () {
            puller.shouldHandleEvent({} as GithubBody, {
                "x-github-event": "push"
            } as GithubHeaders, {
                headers: {
                    'x-github-event': 'push'
                }
            } as unknown as Request).should.be.true;

            puller.shouldHandleEvent({} as GithubBody, {
                "x-github-event": "create"
            } as GithubHeaders, {
                headers: {
                    'x-github-event': 'create'
                }
            } as unknown as Request).should.be.false;
        });
    });
    describe("#refs", function () {
        it("should only handle tagged commits on 'main' branch", function () {
            puller.shouldHandleRef({
                base_ref: 'refs/heads/main',
                ref: 'refs/tags/some_tag'
            } as GithubBody, {} as GithubHeaders, {
                body: {
                    base_ref: 'refs/heads/main',
                    ref: 'refs/tags/some_tag'
                }
            } as unknown as Request).should.be.true;

            puller.shouldHandleRef({
                base_ref: 'refs/heads/master',
                ref: 'refs/tags/some_tag'
            } as GithubBody, {} as GithubHeaders, {
                body: {
                    base_ref: 'refs/heads/master',
                    ref: 'refs/tags/some_tag'
                }
            } as unknown as Request).should.be.false;

            puller.shouldHandleRef({
                ref: 'refs/heads/master'
            } as GithubBody, {} as GithubHeaders, {
                body: {
                    ref: 'refs/heads/master'
                }
            } as unknown as Request).should.be.false;

            puller.shouldHandleRef({
                ref: 'refs/heads/main'
            } as GithubBody, {} as GithubHeaders, {
                body: {
                    ref: 'refs/heads/main'
                }
            } as unknown as Request).should.be.false;
        });
    });
    describe("#pushers", function () {
        it("should ignore commits with '[bot]' in the pusher's name", function () {
            puller.shouldHandlePusher({
                pusher: {
                    name: "me!"
                }
            } as GithubBody, {} as GithubHeaders, {
                body: {
                    pusher: {
                        name: "me!"
                    }
                }
            } as unknown as Request).should.be.true;

            puller.shouldHandlePusher({
                pusher: {
                    name: "[bot] idk"
                }
            } as GithubBody, {} as GithubHeaders, {
                body: {
                    pusher: {
                        name: "[bot] idk"
                    }
                }
            } as unknown as Request).should.be.false;
        });
    });
    describe("#commits", function () {
        it("should ignore commits with '[nopull]' in commit message", function () {
            puller.shouldHandleCommit({
                commits: [],
                head_commit: {
                    message: "hi!"
                }
            } as GithubBody, {} as GithubHeaders, {
                body: {
                    commits: [],
                    head_commit: {
                        message: "hi!"
                    }
                }
            } as unknown as Request).should.be.true;

            puller.shouldHandleCommit({
                commits: [],
                head_commit: {
                    message: "[nopull] don't pull me pls"
                }
            } as GithubBody, {} as GithubHeaders, {
                body: {
                    commits: [],
                    head_commit: {
                        message: "[nopull] don't pull me pls"
                    }
                }
            } as unknown as Request).should.be.false;
        });
    });
});
