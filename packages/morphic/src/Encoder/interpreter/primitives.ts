import * as A from "@effect-ts/core/Array"
import * as E from "@effect-ts/core/Either"
import { flow, pipe } from "@effect-ts/core/Function"
import * as L from "@effect-ts/core/List"
import * as NA from "@effect-ts/core/NonEmptyArray"
import * as O from "@effect-ts/core/Option"
import * as T from "@effect-ts/core/Sync"

import type { PrimitivesURI } from "../../Algebra/Primitives"
import { forEachNonEmptyArray } from "../../Decoder/interpreter/common"
import { interpreter } from "../../HKT"
import { encoderApplyConfig, EncoderType, EncoderURI } from "../base"

export const regexUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const encoderPrimitiveInterpreter = interpreter<EncoderURI, PrimitivesURI>()(
  () => ({
    _F: EncoderURI,
    function: (_, __, config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: () => {
              throw new Error("cannot encode functions")
            }
          },
          env,
          {}
        )
      ),
    unknownE: (k, config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(k(env).encoder, env, {
          encoder: k(env).encoder
        })
      ),
    date: (config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: (u) => T.sync(() => u.toISOString())
          },
          env,
          {}
        )
      ),
    boolean: (config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: T.succeed
          },
          env,
          {}
        )
      ),
    string: (config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: T.succeed
          },
          env,
          {}
        )
      ),
    number: (config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: T.succeed
          },
          env,
          {}
        )
      ),
    bigint: (config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: (u) => T.succeed(u.toString(10))
          },
          env,
          {}
        )
      ),
    stringLiteral: (k, config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: T.succeed
          },
          env,
          {}
        )
      ),
    numberLiteral: (k, config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: T.succeed
          },
          env,
          {}
        )
      ),
    oneOfLiterals: (..._ls) => (config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: T.succeed
          },
          env,
          {}
        )
      ),
    keysOf: (keys, config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: T.succeed
          },
          env,
          {}
        )
      ),
    nullable: (getType, config) => (env) =>
      pipe(
        getType(env).encoder,
        (encoder) =>
          new EncoderType(
            encoderApplyConfig(config?.conf)(
              {
                encode: O.fold(() => T.succeed(null), encoder.encode)
              },
              env,
              { encoder }
            )
          )
      ),
    mutable: (getType, config) => (env) =>
      pipe(
        getType(env).encoder,
        (encoder) =>
          new EncoderType(encoderApplyConfig(config?.conf)(encoder, env, { encoder }))
      ),
    optional: (getType, config) => (env) =>
      pipe(
        getType(env).encoder,
        (encoder) =>
          new EncoderType(
            encoderApplyConfig(config?.conf)(
              {
                encode: (u) => (u == null ? T.succeed(undefined) : encoder.encode(u))
              },
              env,
              { encoder }
            )
          )
      ),
    array: (getType, config) => (env) =>
      pipe(
        getType(env).encoder,
        (encoder) =>
          new EncoderType(
            encoderApplyConfig(config?.conf)(
              {
                encode: A.forEachF(T.Applicative)(encoder.encode)
              },
              env,
              { encoder }
            )
          )
      ),
    list: (getType, config) => (env) =>
      pipe(
        getType(env).encoder,
        (encoder) =>
          new EncoderType(
            encoderApplyConfig(config?.conf)(
              {
                encode: flow(
                  L.forEachF(T.Applicative)(encoder.encode),
                  T.map(L.toArray)
                )
              },
              env,
              { encoder }
            )
          )
      ),
    nonEmptyArray: (getType, config) => (env) =>
      pipe(
        getType(env).encoder,
        (encoder) =>
          new EncoderType(
            encoderApplyConfig(config?.conf)(
              {
                encode: NA.forEachF(T.Applicative)(encoder.encode)
              },
              env,
              { encoder }
            )
          )
      ),
    uuid: (config) => (env) =>
      new EncoderType(
        encoderApplyConfig(config?.conf)(
          {
            encode: T.succeed
          },
          env,
          {}
        )
      ),
    either: (e, a, config) => (env) =>
      pipe(e(env).encoder, (left) =>
        pipe(
          a(env).encoder,
          (right) =>
            new EncoderType(
              encoderApplyConfig(config?.conf)(
                {
                  encode: E.fold(
                    flow(left.encode, T.map(E.left)),
                    flow(right.encode, T.map(E.right))
                  )
                },
                env,
                {
                  left,
                  right
                }
              )
            )
        )
      ),
    option: (a, config) => (env) =>
      pipe(
        a(env).encoder,
        (encoder) =>
          new EncoderType(
            encoderApplyConfig(config?.conf)(
              {
                encode: O.fold(
                  () => T.succeed(O.none),
                  flow(encoder.encode, T.map(O.some))
                )
              },
              env,
              {
                encoder
              }
            )
          )
      ),
    tuple: (...types) => (cfg) => (env) =>
      new EncoderType(
        encoderApplyConfig(cfg?.conf)(
          {
            encode: (values) =>
              pipe(
                values,
                forEachNonEmptyArray((i, a) => types[i](env).encoder.encode(a)) as any
              )
          },
          env,
          {
            encoders: types.map((d) => d(env).encoder) as any
          }
        )
      )
  })
)
