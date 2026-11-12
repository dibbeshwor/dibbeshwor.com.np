/** Builds the paint tile off the main thread and hands the pixels back without a copy. */
import { impasto } from './impasto'

const data = impasto()
;(self as unknown as Worker).postMessage(data, [data.buffer])
