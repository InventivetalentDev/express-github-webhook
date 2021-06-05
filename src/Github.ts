import { IncomingHttpHeaders } from "http";

export interface GithubBody {
    commits: GithubCommit[];
    head_commit: GithubCommit;

    pusher: GithubUser;

    base_ref?: string;
    ref: string;

    created: boolean;
    deleted: boolean;

    [extraProperty: string]: any;
}

export interface GithubHeaders extends IncomingHttpHeaders {
    "x-github-event": string;
    "x-hub-signature": string;
}

export interface GithubCommit {
    id: string;
    message: string
    author: GithubUser;

    [extraProperty: string]: any;
}

export interface GithubUser {
    email: string | null;
    name: string;

    [extraProperty: string]: any;
}
