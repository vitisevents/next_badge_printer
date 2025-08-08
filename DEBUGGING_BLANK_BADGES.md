# Debugging Blank Badges in PDF Generation

## Step-by-Step Debugging Process

I've added comprehensive debug logging to help identify why your badges are appearing blank in the PDF. Here's how to debug:

### **Step 1: Open Browser Developer Tools**

1. Open your badge generation app in the browser
2. Press `F12` to open Developer Tools
3. Go to the **Console** tab
4. Clear the console (click the 🚫 icon)

### **Step 2: Load an Event and Generate Badges**

1. Select an event and ticket types
2. Choose a template
3. Click "Download PDF"
4. Watch the console for debug output

### **Step 3: Check the Debug Output**

You should see several debug messages in the console:

#### **A. Template Loading**
```
Templates API response: [array of templates]
Selected first template: {template object}
```

**What to look for:**
- Are templates loading correctly?
- Does the selected template have the right background image?
- Are font settings present?

#### **B. Ticket Data Loading**
```
Tickets API response: {count: X, sampleTicket: {...}}
```

**What to look for:**
- Are tickets loading with proper data?
- Do tickets have `holder_name`, `holder_email`, etc.?
- Are custom fields present?

#### **C. Badge Component Rendering**
```
EnhancedBadgeComponent render: {
  isBack: false,
  eventName: "...",
  ticketType: "...",
  fields: [...],
  template: {...}
}
```

**What to look for:**
- Are field values being passed correctly?
- Is the template data complete?
- Are names and other data present?

#### **D. PDF Generation Debug**
```
=== PDF GENERATION DEBUG ===
Found badge elements: {fronts: X, backs: Y, totalTickets: Z}
First badge element: {outerHTML: "...", textContent: "...", ...}
Badge 1 content check: {textContent: "...", textLength: X, hasBackground: true/false}
```

**What to look for:**
- Are badge elements found in the DOM?
- Do they have text content?
- Are they visible and have proper dimensions?

### **Step 4: Common Issues and Solutions**

#### **Issue 1: No Templates Loading**
**Symptoms:** Empty templates array or default template created
**Solutions:**
- Check if your database has templates
- Verify the `/api/templates` endpoint is working
- Check network tab for API errors

#### **Issue 2: No Ticket Data**
**Symptoms:** Empty tickets array or missing field data
**Solutions:**
- Check if your event has tickets
- Verify the `/api/tickets` endpoint is working
- Check if the event ID is correct

#### **Issue 3: Badge Elements Not Found**
**Symptoms:** `Found badge elements: {fronts: 0, backs: 0}`
**Solutions:**
- Check if badges are rendering in the UI
- Verify the CSS selectors are correct
- Check if the badge components are mounting

#### **Issue 4: Badge Elements Found But No Content**
**Symptoms:** Badges found but `textContent` is empty
**Solutions:**
- Check if field data is being passed correctly
- Verify the field mapping logic
- Check if the template has proper field configurations

#### **Issue 5: Background Images Not Loading**
**Symptoms:** `hasBackground: false` or background image errors
**Solutions:**
- Check if background image URLs are accessible
- Verify CORS settings on image servers
- Check network tab for 404 errors

### **Step 5: Manual Testing**

#### **Test 1: Check Badge Rendering in Browser**
```javascript
// In browser console
const badges = document.querySelectorAll('.badge')
console.log('Badge count:', badges.length)
badges.forEach((badge, index) => {
  console.log(`Badge ${index + 1}:`, {
    text: badge.textContent?.trim(),
    html: badge.outerHTML.substring(0, 200),
    width: badge.offsetWidth,
    height: badge.offsetHeight
  })
})
```

#### **Test 2: Check Template Data**
```javascript
// In browser console
console.log('Selected template:', selectedTemplate)
console.log('Available fields:', availableFields)
console.log('Selected fields:', selectedFields)
```

#### **Test 3: Check Ticket Data**
```javascript
// In browser console
console.log('Tickets:', tickets.slice(0, 3))
console.log('Filtered tickets:', filteredTickets.slice(0, 3))
```

### **Step 6: Specific Debugging for Your Case**

Based on your screenshots, it looks like:
1. **UI shows correct badges** with names, logos, and QR codes
2. **PDF shows blank badges** with only background colors

This suggests the issue is in the **PDF generation process**, not the data or rendering.

#### **Focus on these areas:**

1. **html2canvas rendering**: The component renders correctly in browser but fails in PDF
2. **Font loading**: Google Fonts might not be available during PDF generation
3. **Image loading**: Background images might not load during PDF generation
4. **CSS issues**: Some styles might not be applied during PDF generation

### **Step 7: Quick Fixes to Try**

#### **Fix 1: Force Font Loading**
```javascript
// Add this before PDF generation
await document.fonts.ready
```

#### **Fix 2: Force Image Loading**
```javascript
// Preload background images
const img = new Image()
img.src = template.backgroundImage
await new Promise((resolve) => {
  img.onload = resolve
  img.onerror = resolve
})
```

#### **Fix 3: Use System Fonts**
Temporarily replace Google Fonts with system fonts to test if that's the issue.

### **Step 8: Report Back**

After running through these steps, please report:
1. What debug output you see in the console
2. Any specific error messages
3. Which step reveals the issue
4. Whether badges render correctly in the browser UI

This will help us pinpoint exactly where the problem is occurring and fix it accordingly. 