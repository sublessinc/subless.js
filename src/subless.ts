import {Subless, HitStrategy} from "./subless2.0";

/** Provides a default subless instance with URI hit tracking enabled
 * @return {Subless} A subless instance
 */

const subless = new Subless(HitStrategy.uri);
export default subless;
