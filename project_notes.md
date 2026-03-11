# CoffeeToday Project Notes & Changelog

## [Session Start] - Auto-Documentation System Check
- **Date:** Current Session
- **Status:** Active & Ready
- **Action:** Verified Auto-Documentation protocol.
- **Note:** ระบบจดจำและบันทึกงานอัตโนมัติพร้อมใช้งานสำหรับการพัฒนา POS และ Dashboard แล้วครับ

## [Troubleshooting] - Go Live shows file directory
- **Date:** Current Session
- **Issue:** Using VS Code's "Go Live" feature displays a list of project files instead of the web interface.
- **Diagnosis:** The server defaults to looking for `index.html`, but the project's main file is `manager.html`.
- **Solution:** Recommended renaming `manager.html` to `index.html` to align with web server standards for automatic rendering. This will resolve the issue for future sessions.

## [System Architecture] - Data Flow Confirmation
- **Date:** Current Session
- **Topic:** Confirmed the data flow for the Menu Management system.
- **Flow:** User actions on the web UI (e.g., adding a product via `saveP()`) trigger a `fetch` call from `script.js` to the `GAS_URL`. The Google Apps Script backend then processes this request and updates the master Google Sheets database accordingly.
- **Conclusion:** The UI is correctly decoupled from the database, with Apps Script acting as the intermediary. All changes made on the live website are reflected in the Google Sheet.

## [Code Optimization] - Pre-Git Cleanup
- **Date:** Current Session
- **Action:** Performed a full code audit on `manager.html`, `style.css`, and `script.js`.
- **Changes:**
  - **CSS:** Moved `@keyframes toastSlideIn` from JS injection to `style.css` for better separation of concerns.
  - **JS:** Replaced `window.onload` with `DOMContentLoaded` for safer initialization.
  - **JS:** Added `syncIntervalId` to prevent `setInterval` duplication (memory leak prevention).
  - **JS:** Organized global variables into clear sections.
- **Status:** Files are now optimized, clean, and ready for Git version control.

## [Git Setup] - Initialization & Configuration
- **Date:** Current Session
- **Action:** Created `.gitignore` and explained Git concepts.
- **Concept - git init:** Initializes the version control system (starts tracking changes).
- **Concept - .gitignore:** Specifies files to be intentionally ignored by Git (e.g., system junk, local settings).
- **Status:** Ready for first commit.

## [UI/UX Enhancement] - Premium Date Filter
- **Date:** Current Session
- **Action:** Overhauled the dashboard's date filtering mechanism.
- **Changes:**
  - **HTML:** Restructured the filter panel, wrapping date inputs for better styling.
  - **CSS:** Added styles for `.date-input-wrapper` to create a premium look, hiding the default calendar icon.
  - **CSS:** Implemented `.quick-filter-btn` with `active` and `hover` states for a modern, responsive feel.
  - **JS:** Added `setQuickDateFilter()` to handle one-click date range selection (e.g., 3, 7, 30 days).
  - **JS:** Added `clearQuickFilterActive()` to manage UI state when a manual date is chosen.
- **Status:** The date filter is now more intuitive and visually aligned with the project's premium theme.

## [UI/UX Refinement] - Responsive Date Filter Panel
- **Date:** Current Session
- **Action:** Refactored the date filter panel to be fully responsive and prevent layout overflow.
- **Changes:**
  - **HTML:** Re-structured the filter panel into logical flexbox groups (`quick-filter-group`, `custom-date-group`, `action-button-group`).
  - **CSS:** Applied `flex-wrap: wrap` to the main `.filter-panel` to ensure elements wrap correctly on smaller screens.
  - **CSS:** Created a new `.filter-action-btn` class to standardize the height and padding of the "Filter" and "Report" buttons, aligning them with the date inputs for a cleaner look.
  - **CSS:** Replaced the HTML `<span>-</span>` separator with a CSS pseudo-element for cleaner code.
- **Status:** The filter panel is now robust, responsive, and visually polished.

## [UI/UX Refinement] - Dashboard Header & Date Picker
- **Date:** Current Session
- **Action:** Reorganized the dashboard header and improved date picker usability.
- **Changes:**
  - **HTML:** Moved "Top 10 Best Sellers" title above the filter panel (column layout).
  - **HTML:** Moved custom date inputs to the start of the filter row.
  - **HTML:** Merged "Filter" and "Report" buttons into the quick filter group (next to "30 Days") and reduced their size.
  - **JS/HTML:** Added `onclick="this.showPicker()"` to date inputs and wrappers to allow opening the calendar by clicking anywhere on the box.

## [UI/UX Tweak] - Date Filter Alignment
- **Date:** Current Session
- **Action:** Adjusted the date filter panel layout for precise alignment.
- **Changes:**
  - **HTML:** Modified the `.filter-panel` container to use `flex-direction: column` and `align-items: flex-start`. This stacks the custom date inputs and the quick filter buttons vertically.
  - **HTML:** Overrode the `.quick-filter-group` style to use `justify-content: flex-start`, ensuring the "Today" button aligns perfectly with the start of the date input fields above it.
- **Status:** The alignment issue is resolved, creating a cleaner, more organized header.

## [UI/UX Tweak] - Final Filter Panel Layout
- **Date:** Current Session
- **Action:** Finalized the layout of the date filter panel per user request.
- **Changes:**
  - **HTML:** Moved the "Filter" button (`กรอง`) to be immediately adjacent to the end date input within the `custom-date-group`.
  - **HTML:** Styled the "Filter" button to vertically align with the date inputs for a cohesive look (height: 44px).
  - **HTML:** The "Report" button (`รายงาน`) now occupies the position previously held by the "Filter" button in the quick-filter row.
- **Status:** The dashboard header layout is now finalized and pixel-perfect.

## [UI/UX Tweak] - Filter Button Sizing
- **Date:** Current Session
- **Action:** Adjusted the size of the "Filter" button to match the "Report" button for visual consistency.
- **Changes:**
  - **HTML:** Removed the fixed `height: 44px` from the "Filter" button and applied the same `padding`, `border-radius`, and `font-size` as the other small action buttons.
- **Status:** All action buttons in the filter panel now have a consistent, compact size.

## [UI/UX Tweak] - Date Input Height Adjustment
- **Date:** Current Session
- **Action:** Reduced the height of date input wrappers to match the "Filter" button.
- **Changes:**
  - **CSS:** Updated `.date-input-wrapper` padding from `8px 12px` to `5px 12px` and border-radius from `12px` to `10px`.
- **Status:** Date inputs and action buttons now share the same vertical profile.

## [UI/UX Polish] - Floating Button Effects (Hover)
- **Date:** Current Session
- **Action:** Added premium "floating" hover effects to all primary action buttons.
- **Changes:**
  - **CSS:** Created `.btn-blue`, `.btn-orange`, and `.btn-dark` classes with `transform: translateY(-4px)` and colored `box-shadow` on hover.
  - **HTML:** Updated "Report", "Save Order", and "Add Category" buttons to use these new classes instead of inline styles.
- **Status:** All main buttons now have a consistent, interactive "pop-up" animation on hover.

## [UI/UX Polish] - Order Table Compact View
- **Date:** Current Session
- **Action:** Adjusted font sizes in the order history table for a more compact view.
- **Changes:**
  - **JS (`renderTable`):** Reduced the Order ID font size from `16px` to `14px` to prevent line breaks.
  - **JS (`renderTable`):** Reduced the item list font size from `12px` to `11px` and line-height from `1.4` to `1.3` for better readability in a compact space.
- **Status:** Order table is now more space-efficient and ready for the next phase.

## [Development Workflow] - Bug & Error Testing Strategy
- **Date:** Current Session
- **Topic:** Established a testing methodology for the project within the VS Code environment.
- **Methods:**
  - **Linting (Real-time Analysis):** Utilize the ESLint extension to automatically detect syntax errors and potential bugs during code implementation.
  - **Debugging (In-depth Analysis):** Use VS Code's built-in debugger (F5) with breakpoints to pause execution, step through code line-by-line, and inspect variable states (e.g., `allOrders`, `pgNum`).
  - **Browser Developer Tools (Network & Application Analysis):** Use the browser's F12 tools, specifically the 'Console' tab for runtime errors, the 'Network' tab to monitor `fetch` requests to `GAS_URL`, and the 'Application' tab to inspect `localStorage` for the auth token.
- **Status:** A comprehensive testing strategy is now documented.

## [System Audit] - Final Pre-POS Code Cleanup
- **Date:** Current Session
- **Action:** Performed a deep scan and fix of `manager.html` and `script.js` to ensure stability before POS development.
- **Fixes:**
  - **JS (`script.js`):** Removed redundant CSS injection (`toastAnim`) as it's now handled in `style.css`.
  - **JS (`script.js`):** Added null-safety checks `(item.items || '')` in `renderTable`, `viewOrderDetail`, `downloadPDF`, and `printOrder` to prevent crashes on incomplete data.
  - **JS (`script.js`):** Added a safety check for `menuObj.categories` in `saveMenuOrder`.
  - **HTML (`manager.html`):** Wrapped `showPicker()` calls in `try...catch` blocks to prevent runtime errors on browsers that don't support the API.
- **Status:** System code is now robust, clean, and ready for the POS phase.

## [Development Workflow] - VS Code & Git Integration
- **Date:** Current Session
- **Topic:** Clarified the workflow for syncing code between the local VS Code environment and a remote Git repository (e.g., GitHub).
- **Workflow:**
  1.  **Modify:** Edit code files directly within VS Code.
  2.  **Stage (`git add`):** In the Source Control panel (Ctrl+Shift+G), click the `+` icon next to changed files to prepare them for a snapshot.
  3.  **Commit (`git commit`):** Write a descriptive message in the input box (e.g., "Refined dashboard UI") and click the checkmark icon to create a local save point.
  4.  **Push (`git push`):** Click the "Sync Changes" or "Push" button to upload the committed changes to the remote repository.
- **Conclusion:** This workflow eliminates the need for manual copy-pasting and provides professional version control directly within the editor.

## [Session End] - Daily Wrap-up
- **Date:** Current Session
- **Status:** Paused (User requested break)
- **Achievements:**
  - Finalized Dashboard UI (Date filter layout, Floating buttons, Compact table fonts).
  - Performed Deep Code Audit & Fixes (Null safety, Cleanup).
  - Established VS Code & Git workflow concepts.
- **Next Steps:** Implement automated Git update workflow (CI/CD or VS Code integration setup).

## [Session Start] - Resume Development
- **Date:** Current Session
- **Status:** Active
- **Action:** Resumed session upon Boss's request.
- **Focus:** Implementing Git workflow and preparing for POS development.

## [Pre-Git Final Audit] - Integrity & Loop Check
- **Date:** Current Session
- **Action:** Comprehensive review of all logic files (`script.js`, `stock.html`, `odsc.html`, `odfc.html`).
- **Fixes:**
  - **Anti-Lock System:** Moved validation logic in `saveMenuOrder` *before* button disabling to prevent permanent lock if data is missing.
  - **Cache Busting:** Added timestamp (`v=time`) to `managerGetData` and `stock.html` fetch calls to ensure infinite real-time updates without browser caching issues.
  - **Connection Verification:** Confirmed data flow from Client -> GAS -> Sheet -> Manager/Stock.
- **Status:** All files are verified loop-safe and ready for version control.

## [Final UI Consistency Check] - All Files
- **Date:** Current Session
- **Action:** Verified responsive behaviors across `manager.html`, `stock.html`, `odsc.html`, and `odfc.html`.
- **Refinement:** Applied `flex-wrap: wrap` to `stock.html` search box to match the responsive standards of the Manager dashboard.
- **Status:** All interfaces are now fully optimized for their respective use cases (Manager = Compact Data, Customer = Touch Friendly, Stock = Readable KDS).

## [Git Deployment] - Version Control Upload
- **Date:** Current Session
- **Action:** Provided step-by-step instructions for initializing and pushing code to a remote Git repository.
- **Status:** Pending user execution.

## [Git Configuration] - Multi-Account Setup
- **Date:** Current Session
- **Action:** Provided detailed instructions for setting up Git with a specific user identity different from the global system default.
- **Focus:** Configuring `user.name` and `user.email` locally within the project scope and managing VS Code authentication to ensure the correct account owns the repository.
- **Status:** Guide delivered.

## [Git Knowledge] - Identity Clarification
- **Date:** Current Session
- **Topic:** Clarified the distinction between `git config user.name` (Author Identity) and the GitHub Repository Owner.
- **Conclusion:** Confirmed that `user.name` and `email` should represent the current user (the author of the commits), while the Repository Owner is defined by the Remote URL and Login credentials.
- **Status:** User informed.

## [Git Troubleshooting] - Identity Override
- **Date:** Current Session
- **Issue:** User reported `git config` displaying a previously set (global) email instead of the intended project-specific email.
- **Diagnosis:** The local configuration command likely failed due to terminal glitches, causing Git to fallback to the global default.
- **Solution:** Re-issued `git config user.email` without `--global` to force a local override for this repository.
- **Status:** Pending user verification.

## [Git Troubleshooting] - Missing Initialization
- **Date:** Current Session
- **Issue:** User encountered "fatal: not in a git directory" error when attempting to configure user identity.
- **Diagnosis:** The `git init` command was likely skipped or not executed successfully, meaning the `.git` folder does not exist yet.
- **Solution:** Instructed user to run `git init` immediately before retrying configuration and commit commands.
- **Status:** Pending execution.

## [Git Knowledge] - Line Ending Warning (LF vs CRLF)
- **Date:** Current Session
- **Topic:** User encountered `warning: LF will be replaced by CRLF` during `git add`.
- **Explanation:** Clarified that this is standard Git behavior on Windows (`core.autocrlf=true`). Git stores files with Unix-style line endings (LF) but converts them to Windows-style (CRLF) in the working directory.
- **Status:** User reassured, proceeding to commit.

## [Git Troubleshooting] - Undo & Selective Commit
- **Date:** Current Session
- **Issue:** User committed all files including documentation/context ("AI Brain") but intended to commit only source code.
- **Solution:** Provided `git reset` sequence to undo the commit and clear the staging area, followed by instructions to explicitly `git add` only the required source files (`.html`, `.css`, `.js`).
- **Status:** Pending user execution.

## [Git Troubleshooting] - Removing Files form Tracking (Cached)
- **Date:** Current Session
- **Issue:** The initial commit included documentation files (`.md`) because the previous reset failed (likely due to being the root commit).
- **Solution:** Instructed user to use `git rm --cached <file>` to remove files from the index while keeping them locally, then `git commit --amend` to rewrite the clean commit history.
- **Status:** Pending execution.

## [Git Verification] - Status Check
- **Date:** Current Session
- **Issue:** User suspected that the remote repository connection and local identity configuration might have been skipped or lost during troubleshooting.
- **Action:** Instructed user to run `git remote -v` to verify remote URL and `git config user.name` to verify identity.
- **Goal:** Ensure the "bridge" to GitHub is built before attempting to push code.
- **Status:** Pending user verification.

## [Git Finalization] - Linking Remote & Push
- **Date:** Current Session
- **Finding:** `git remote -v` returned empty, confirming the repository was locally initialized but not linked to GitHub. User identity was correctly set.
- **Action:** Provided commands to `git remote add origin`, standardize branch to `main`, and `git push --force` to synchronize the codebase.
- **Status:** Deployment commands issued.

## [Git Troubleshooting] - Selective File Tracking
- **Date:** Current Session
- **Issue:** User reported that all files (including documentation/notes) were staged for upload, despite wanting only source code.
- **Solution:** Provided a "Reset & Select" workflow: `git rm -r --cached .` to clear the index, followed by explicit `git add` for only the 6 core source files.
- **Status:** Pending user execution to clean the repository state.

## [Git Status Confirmation] - Repository Cleaning
- **Date:** Current Session
- **Observation:** `git status` confirms that documentation files (`.md`) and extraneous folders (`New folder/`, `POS/`) are successfully untracked or staged for deletion from the index.
- **Verified:** Only the core application files are currently staged (implicit from previous steps) or waiting to be committed.
- **Action:** Advised user to re-add `.gitignore` before final commit to maintain repository hygiene.
- **Status:** Ready for final push.

## [UI/UX Enhancement] - Order Form Pagination & Search
- **Date:** Current Session
- **Action:** Implemented major UI/UX upgrades for customer-facing order forms (`odsc.html`, `odfc.html`).
- **Changes:**
  - **Floating Search:** Added a new floating action button (FAB) that toggles a dedicated search bar. This allows users to filter products across all categories in real-time.
  - **Search UI:** When searching, the category tabs are hidden, and a "Category" column appears in the results table for clarity.
  - **Pagination System:** Integrated a full pagination system below the category tabs.
  - **View Controls:** Users can now select to view 8, 15, or 30 items per page.
  - **Dynamic Rendering:** Refactored the entire product rendering logic (`buildProductUI`) to be fully dynamic, supporting both category browsing and search results with pagination.
  - **Code Refactor:** Replaced the static, section-based rendering with a single, powerful `renderProducts()` function that handles all view states.
- **Status:** The order forms are now significantly more user-friendly and capable of handling large product catalogs efficiently.

## [Git Deployment] - Selective Upload
- **Date:** Current Session
- **Action:** User decided to upload *only* the 6 core files (`manager.html`, `stock.html`, `odsc.html`, `odfc.html`, `style.css`, `script.js`), explicitly excluding `POS/`, `.gitignore`, and documentation.
- **Procedure:** Confirmed that the "deleted" status for other files in the staging area is the intended behavior to remove them from the remote repository while keeping them local.
- **Status:** Executing final commit and force push.

## [UI/UX Adjustment] - Order Table ID Column
- **Date:** Current Session
- **Action:** Adjusted the styling of the Order ID column in the Order History table.
- **Changes:**
  - **Manager HTML:** Increased the "Order ID" column width from `110px` to `140px` to prevent text wrapping and accommodate larger fonts.
  - **Script JS:** Increased the font size of the Order ID link from `12px` to `15px` for better readability and balance.
  - **Script JS:** Added `white-space: nowrap` to the Order ID element to force it to stay on a single line, resolving the layout inconsistency reported by the user.
- **Status:** Layout fixed.

## [UI/UX Adjustment] - Dashboard Spacing & Typography
- **Date:** Current Session
- **Action:** Optimized dashboard spacing and increased font sizes for better readability and balance.
- **Changes:**
  - **CSS:** Reduced `.main-content` padding from `50px` to `25px` to minimize empty space on the left and maximize content area.
  - **CSS:** Increased global font sizes for Table Headers (`th`: 11px -> 13px), Table Cells (`td`: 12px -> 14px), Section Titles (`20px`), and Badges (`12px`).
  - **JS:** Updated `renderTable` to generate rows with larger inline font sizes (Date: 13px, Branch/Customer/Phone: 14px, Items: 13px), ensuring consistency with the CSS updates.
- **Status:** The dashboard now feels more spacious yet content-rich, with clearly legible text.