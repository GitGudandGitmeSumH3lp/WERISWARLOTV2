## Error Type
Console ValidationError

## Error Message
Level validation failed


    at LevelLoader.load (src/core/LevelLoader.ts:44:23)
    at async testConsoleAPI (src/app/level-loader-test/page.tsx:121:27)

## Code Frame
  42 |             const assetResult = await this._validateAssets(typedData);
  43 |             if (!assetResult.valid) {
> 44 |                 throw new ValidationError(assetResult.errors);
     |                       ^
  45 |             }
  46 |             
  47 |             const constraintResult = this._validateConstraints(typedData);

Next.js version: 16.1.1 (Turbopack)

## Error Type
Console NetworkError

## Error Message
Failed to load level: /levels/invalid_bounds.json (404)


    at LevelLoader.load (src/core/LevelLoader.ts:17:23)
    at async runEdgeCaseTests (src/app/level-loader-test/page.tsx:101:17)

## Code Frame
  15 |             const response = await fetch(levelPath);
  16 |             if (!response.ok) {
> 17 |                 throw new NetworkError(`Failed to load level: ${levelPath} (${response.status})`);
     |                       ^
  18 |             }
  19 |             
  20 |             // Parse JSON

Next.js version: 16.1.1 (Turbopack)

## Error Type
Console Error

## Error Message
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <HotReload globalError={[...]} webSocket={WebSocket} staticIndicatorState={{pathname:null, ...}}>
      <AppDevOverlayErrorBoundary globalError={[...]}>
        <ReplaySsrOnlyErrors>
        <DevRootHTTPAccessFallbackBoundary>
          <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
            <HTTPAccessFallbackErrorBoundary pathname="/level-loa..." notFound={<NotAllowedRootHTTPFallbackError>} ...>
              <RedirectBoundary>
                <RedirectErrorBoundary router={{...}}>
                  <Head>
                  <__next_root_layout_boundary__>
                    <SegmentViewNode type="layout" pagePath="layout.tsx">
                      <SegmentTrieNode>
                      <link>
                      <script>
                      <RootLayout>
                        <html lang="en">
                          <body
                            className="inter_5972bc34-module__OU16Qa__className"
-                           style={{margin-top:"0px",margin-right:"0px",margin-bottom:"0px",margin-left:"0px"}}
                          >
                  ...



    at body (<anonymous>:null:null)
    at RootLayout (src\app\layout.tsx:19:7)

## Code Frame
  17 |   return (
  18 |     <html lang="en">
> 19 |       <body className={inter.className}>
     |       ^
  20 |         {children}
  21 |       </body>
  22 |     </html>

Next.js version: 16.1.1 (Turbopack)
