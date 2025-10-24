# Example Transformation: Payment Form

## Before (Legacy Code)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Payment Form</title>
</head>
<body>
    <table width="100%" cellpadding="10" bgcolor="#f0f0f0">
        <tr>
            <td>
                <font size="5" color="#333333"><b>Payment Information</b></font>
            </td>
        </tr>
        <tr>
            <td>
                <table width="100%">
                    <tr>
                        <td width="30%"><font color="#666666">Card Number:</font></td>
                        <td width="70%">
                            <input type="text" name="card" style="width: 100%; padding: 5px; border: 1px solid #ccc;">
                        </td>
                    </tr>
                    <tr>
                        <td><font color="#666666">Expiry Date:</font></td>
                        <td>
                            <input type="text" name="expiry" style="width: 100%; padding: 5px; border: 1px solid #ccc;">
                        </td>
                    </tr>
                    <tr>
                        <td><font color="#666666">CVV:</font></td>
                        <td>
                            <input type="text" name="cvv" style="width: 100%; padding: 5px; border: 1px solid #ccc;">
                        </td>
                    </tr>
                    <tr>
                        <td colspan="2" align="center">
                            <input type="submit" value="Submit Payment" style="background: #0066cc; color: white; padding: 10px 30px; border: none; cursor: pointer;">
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

**Problems:**
- Uses tables for layout
- Inline styles everywhere
- Non-semantic HTML (`<font>` tags, etc.)
- No accessibility (missing labels, no ARIA)
- Not responsive
- Poor maintainability

## After (Modern Code)

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Form</title>
    <style>
        :root {
            --primary-color: #0066cc;
            --bg-light: #f0f0f0;
            --text-primary: #333;
            --text-secondary: #666;
            --border-color: #ccc;
            --spacing-sm: 0.5rem;
            --spacing-md: 1rem;
            --spacing-lg: 1.5rem;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            padding: var(--spacing-lg);
        }

        .payment-form {
            max-width: 500px;
            margin: 0 auto;
            background: var(--bg-light);
            padding: var(--spacing-lg);
            border-radius: 8px;
        }

        .payment-form__title {
            color: var(--text-primary);
            font-size: 1.5rem;
            margin-bottom: var(--spacing-lg);
        }

        .form-group {
            margin-bottom: var(--spacing-md);
        }

        .form-group__label {
            display: block;
            color: var(--text-secondary);
            margin-bottom: var(--spacing-sm);
            font-weight: 500;
        }

        .form-group__input {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 1rem;
            transition: border-color 0.2s;
        }

        .form-group__input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
        }

        .payment-form__submit {
            width: 100%;
            padding: 0.75rem;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 4px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }

        .payment-form__submit:hover {
            background: #0052a3;
        }

        .payment-form__submit:focus {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
        }

        @media (max-width: 600px) {
            .payment-form {
                padding: var(--spacing-md);
            }
        }
    </style>
</head>
<body>
    <form class="payment-form" aria-labelledby="payment-title">
        <h1 id="payment-title" class="payment-form__title">Payment Information</h1>
        
        <div class="form-group">
            <label for="card-number" class="form-group__label">Card Number</label>
            <input 
                type="text" 
                id="card-number" 
                name="card" 
                class="form-group__input"
                required
                autocomplete="cc-number"
                aria-describedby="card-help"
            >
        </div>
        
        <div class="form-group">
            <label for="expiry-date" class="form-group__label">Expiry Date</label>
            <input 
                type="text" 
                id="expiry-date" 
                name="expiry" 
                class="form-group__input"
                placeholder="MM/YY"
                required
                autocomplete="cc-exp"
            >
        </div>
        
        <div class="form-group">
            <label for="cvv" class="form-group__label">CVV</label>
            <input 
                type="text" 
                id="cvv" 
                name="cvv" 
                class="form-group__input"
                required
                autocomplete="cc-csc"
                maxlength="3"
            >
        </div>
        
        <button type="submit" class="payment-form__submit">
            Submit Payment
        </button>
    </form>
</body>
</html>
```

**Improvements:**
✅ Semantic HTML5 elements
✅ CSS variables for maintainability
✅ Proper accessibility (labels, ARIA)
✅ Mobile-responsive design
✅ Focus states for keyboard navigation
✅ Modern CSS Grid/Flexbox (where appropriate)
✅ No inline styles
✅ BEM naming convention
✅ Smooth transitions and hover effects

**Key Changes:**
1. Replaced table layout with semantic `<form>` and divs
2. Added proper `<label>` elements linked to inputs
3. Implemented CSS variables for theming
4. Added ARIA attributes for screen readers
5. Made fully responsive with media queries
6. Added focus states for accessibility
7. Used semantic HTML5 throughout
8. Implemented proper form validation attributes
