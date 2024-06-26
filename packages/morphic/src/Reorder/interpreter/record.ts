import { pipe } from "@effect-ts/core/Function"
import * as R from "@effect-ts/core/Record"
import * as T from "@effect-ts/core/Sync"

import type { RecordURI } from "../../Algebra/Record"
import { interpreter } from "../../HKT"
import { reorderApplyConfig, ReorderType, ReorderURI } from "../base"

export const reorderRecordInterpreter = interpreter<ReorderURI, RecordURI>()(() => ({
  _F: ReorderURI,
  record: (getCodomain, config) => (env) =>
    pipe(
      getCodomain(env).reorder,
      (reorder) =>
        new ReorderType(
          reorderApplyConfig(config?.conf)(
            {
              reorder: R.forEachF(T.Applicative)(reorder.reorder)
            },
            env,
            { reorder }
          )
        )
    )
}))
