const sublessHeaders = new Headers();
sublessHeaders.set("Cache-Control", "no-store");
// Provided by env files
const sublessUri = process.env.SUBLESS_URL;
const sublessCdn = process.env.SUBLESS_CDN;
const clientBaseUri = location.protocol + "//" + window.location.hostname + (location.port ? ":" + location.port : "") + "/";

interface SublessInterface {
    // camelcase is disabled for these so we don't conflict with customer namespaces
    subless_GetConfig(hitStrategy: HitStrategy): Promise<SublessSettings>; // eslint-disable-line camelcase
    sublessLogin(): Promise<void>;
    subless_LoggedIn(): Promise<boolean>; // eslint-disable-line camelcase
    subless_hit(): Promise<void>; // eslint-disable-line camelcase
    sublessLogout(): Promise<void>;
    sublessShowBanner(): Promise<void>;
}

// Defines whether hits will be reported using the page URI, or tags conatined within it
export enum HitStrategy {
    uri,
    tag
}

// Settings which define the behavior of the embedded js
interface SublessSettings {
    redirectUri: string;
    postLogoutRedirectUri: string;
    authority: string;
    clientId: string;
    hitStrategy: HitStrategy;
}

const sublessConfig: SublessSettings = {
    redirectUri: clientBaseUri,
    postLogoutRedirectUri: clientBaseUri,
    authority: "",
    clientId: "",
    hitStrategy: HitStrategy.uri,
};


/** A set of methods that can be used to integrate a partner site with Subless,
 * such that the partner can allow Subless users to distribute funds to the creators
 * the users visit on their site.
 */
export class Subless implements SublessInterface {
    sublessConfig: Promise<SublessSettings>;
    /** On initialization
     * Get configuration
     * Verify whether user is authenticated
     * if so, record a hit, if valid
     * @param {HitStrategy} hitStrategy strategy to use when detecting creator
     */
    constructor(hitStrategy: HitStrategy) {
        this.sublessConfig = this.subless_GetConfig(hitStrategy=hitStrategy);
        this.subless_hit();
    }

    /** Query Subless for the latest authorization configuration for the Subless server.
     * @param {HitStrategy} hitStrategy strategy to use when detecting creator
    */
    async subless_GetConfig(hitStrategy: HitStrategy): Promise<SublessSettings> {
        const resp = await fetch(sublessUri + "/api/Authorization/settings");
        const json = await resp.json();
        sublessConfig.authority = json.cognitoUrl;
        sublessConfig.clientId = json.appClientId;
        sublessConfig.hitStrategy = hitStrategy;
        return sublessConfig;
    }


    /** A method that can be used to redirect a user to a Subless login. I.e., can be attached
     * to a "sign in to subless" button on a partner site.
     */
    async sublessLogin() {
        await this.sublessConfig;
        window.location.href = sublessUri + "/bff/login?returnUrl=" + clientBaseUri;
    }

    /** Check whether a user who had loaded this page is logged into a Subless account. */
    async subless_LoggedIn(): Promise<boolean> { // eslint-disable-line camelcase
        const result = await this.sublessGetLoginState();
        if (result == 0) {
            return false;
        }
        if (result == 1) {
            return true;
        }
        if (result == 2) {
            await this.renewLogin();
            return true;
        }
        return false;
    }

    /** Starts a redirect chain to renew your session cookie */
    async renewLogin() {
        const path = window.location.href;
        window.location.href = sublessUri + "/renew?return_uri=" + path;
    }

    /** Gets the current state of the login */
    async sublessGetLoginState(): Promise<number> {
        return await fetch(sublessUri + "/api/user/loginStatus", {
            method: "Get",
            headers: {
                "Content-Type": "application/json",
            },
            credentials: "include",
        }).then((response) => response.json());
    }

    /** If a user is logged in, report the user's view of this creator/site to the subless server. */
    async subless_hit() { // eslint-disable-line camelcase
        const loggedIn = await this.subless_LoggedIn();
        if (loggedIn) {
            if ((await this.sublessConfig).hitStrategy === HitStrategy.tag) {
                await this.pushTagHit();
            } else {
                await this.pushUriHit();
            }
        }
    }

    /** Push hits based on tags */
    async pushTagHit() {
        const creators = await this.getSublessTags();
        for (const creator of creators) {
            // The below rule is disabled to force evaluation.
            const body = // eslint-disable-line no-unused-vars
                fetch(sublessUri + "/api/hit/tag", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        uri: window.location.origin + window.location.pathname,
                        creator: creator,
                    }),
                    credentials: "include",
                });
            await body.then((response) => response.json());
        }
    }

    /** Push hits based on uris */
    async pushUriHit() {
        // The below rule is disabled to force evaluation.
        const body = // eslint-disable-line no-unused-vars
            fetch(sublessUri + "/api/hit", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: window.location.origin + window.location.pathname,
                credentials: "include",
            });
        await body.then((response) => response.json());
    }

    /** Inserts subless message into the page. Used for optional feature to display banner ads from subless cdn */
    async sublessShowBanner(): Promise<void> {
        const messageDiv = document.getElementById("sublessMessage");
        const link = document.createElement("a");
        const img = document.createElement("img");
        const urls = this.getmessage();
        img.src = urls[0];
        img.id = "sublessMessageImage";
        img.style.maxHeight = "90px";
        link.href = urls[1];
        link.id = "sublessMessageLink";
        link.appendChild(img);
        if (messageDiv) {
            messageDiv.appendChild(link);
        }
    }

    /** Gets a random subless message and corresponding link
     * @return {[string, string]}tuple of image and target URI
    */
    private getmessage(): [string, string] {
        const message = Math.floor(Math.random() * 8) + 1;
        const img = `${sublessCdn}/message${message}.png`;
        if (message == 3) {
            return [img, `https://www.subless.com/hf-creator-instructions?utm_campaign=message${message}`];
        }
        return [img, `https://www.subless.com/patron?utm_campaign=message${message}`];
    }

    /** A method that can be used to log a user out from Subless */
    async sublessLogout() {
        window.open(sublessUri + "/bff/logout?returnUrl=" + clientBaseUri, "_blank");
    }

    /** Get all subless tagged content */
    async getSublessTags(): Promise<string[]> {
        const creators: string[] = [];
        const sublessTags = document.querySelectorAll("subless");
        for (let i = 0; i < sublessTags.length; i++) {
            if (sublessTags[i] instanceof HTMLElement) {
                const tag = sublessTags[i].getAttribute("creatorName");
                if (tag) {
                    creators.push(tag);
                }
            }
        }
        return creators;
    }
}

/** Returns a subess instance with URI hit tracking
 * @return {Subless} a subless instance
*/
export function SublessUsingUris() {
    return new Subless(HitStrategy.uri);
}


/** Returns a subess instance with tag hit tracking
 * @return {Subless} a subless instance
*/
export function SublessUsingTags() {
    return new Subless(HitStrategy.tag);
}
