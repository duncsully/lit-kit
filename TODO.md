# TODO

- Finish context
  - Better context store pattern?
  - Rip out old call stack context
- Make urlState cleanup more robust when multiple templates use it*
- Use context in router again?
- Store?
- Readme
- JSDoc the heck out of everything

*I intended only a single component to use these at a time, or at least to have them shared with context if absolutely necessary. But it would be problematic if multiple components used the same key simultaneously. So I should probably add extra logic tracking how many urlState instances are using each key and clean up accordingly.
