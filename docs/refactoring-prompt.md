# Agentic Refactoring Prompt

Use this prompt after completing a feature or when the codebase feels "janky" to identify valuable refactoring opportunities.

---

## Refactoring Analysis Prompt

```
I need you to analyze this codebase for agent-friendly refactoring opportunities. Focus on SUBTRACTING complexity, not adding systems or frameworks.

Please examine the codebase and identify:

## CRITICAL ISSUES (Fix immediately):
1. **Functions >50 lines** - List functions that are too long for agent context
2. **Files >500 lines** - List files that are too large to scan effectively  
3. **Dead code** - List files/functions that appear unused (grep for references)
4. **Duplicate logic** - List code patterns repeated in multiple places
5. **Confusing names** - List files/functions whose names don't match their purpose

## NAVIGATION ISSUES (Fix for agent usability):
1. **Deep hierarchies** - List import paths >3 levels deep (../../../)
2. **Unclear file locations** - Where would an agent look for specific functionality?
3. **Generic/abstract code** - List overly generic functions that hide their actual purpose
4. **Complex imports** - List files with confusing import patterns

## SIMPLIFICATION OPPORTUNITIES:  
1. **Over-engineering** - List abstraction layers that could be removed
2. **Unused flexibility** - List configurable/flexible code that's only used one way
3. **Framework-like code** - List custom systems that could be replaced with simple functions

## ANALYSIS CRITERIA:
- Run the "Grep Test": Can you find functionality with simple search?
- Run the "15-Minute Test": Can a human understand each area quickly?
- Run the "Obvious Location Test": Is there one clear place for each type of code?

## OUTPUT FORMAT:
For each issue found, provide:
- **File/Function name**
- **Specific problem** (e.g. "95 lines, mixes 3 concerns")  
- **Simple fix** (e.g. "Extract validation logic to separate function")
- **Agent benefit** (e.g. "Agent can understand each piece separately")

## CONSTRAINTS:
- Only suggest changes that SUBTRACT complexity
- Don't recommend new abstractions, frameworks, or systems
- Focus on making code more predictable, not more flexible
- Prioritize changes that help agents navigate and understand code

Focus on the biggest wins first - changes that will most improve agent productivity with minimal effort.
```

---

## Usage Instructions

1. **When to use:** After completing a feature, or when code feels complex/hard to navigate
2. **How to use:** Copy the prompt above and run it against your current codebase
3. **What to expect:** Specific, actionable refactoring tasks that simplify without over-engineering
4. **Follow-up:** Implement the highest-impact suggestions first (dead code removal, function splitting)

## Example Usage

```
# After completing a new feature:
"I just added hiring evaluation functionality. Please run the refactoring analysis prompt on the services/ directory (document-generation, hiring-evaluation, keyword-analysis)."

# When code feels janky:
"The codebase is getting hard to navigate. Please run the refactoring analysis prompt and focus on the top 3 simplification opportunities."

# Before a major change:
"I'm about to refactor the document generation logic. Please analyze the current state first using the refactoring prompt."
```

## Success Metrics

After implementing suggested refactoring:
- [ ] Can find any functionality with simple grep/search
- [ ] No functions longer than 50 lines
- [ ] No import paths deeper than 3 levels  
- [ ] File names clearly indicate their purpose
- [ ] No dead code remains
- [ ] Duplicate logic consolidated to single locations

The goal is a codebase where agents can quickly understand any area and successfully complete tasks without getting lost in complexity.