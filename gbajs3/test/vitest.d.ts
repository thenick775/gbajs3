import type { StyleRuleOptions } from '@emotion/jest';

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions -- extending type
  interface Matchers<R extends void | Promise<void> = void | Promise<void>> {
    toHaveStyleRule(
      property: string,
      value: unknown,
      options?: StyleRuleOptions
    ): R;
  }
}
