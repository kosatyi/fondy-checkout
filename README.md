# Fondy Checkout Widget



## Installation

### Node

If you’re using [Npm](https://npmjs.com/) in your project, you can add `fondy-checkout` dependency to `package.json` 
with following command:

```cmd
npm i --save fondy-checkout
```

or add dependency manually:

```json
{
  "dependency": {
    "fondy-checkout":"*"
  }
}
```

### Bower

If you’re using [Bower](https://bower.io/) in your project, you can run the following command:

```cmd
bower install fondy-checkout
```

### Manual installation

If you do not use NodeJS, you can download the
[latest release](https://github.com/kosatyi/fondy-checkout/releases).
Or clone from GitHub the latest developer version
```cmd
git clone git@github.com:kosatyi/fondy-checkout.git
```


## Quick start

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset='utf-8'>
    <meta content='IE=edge,chrome=1' http-equiv='X-UA-Compatible'>
    <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/fondy-checkout@latest/dist/css/checkout.css">
</head>
<body>
<div control="ui.checkout">
    <param name="params[amount]" value="1500" />
    <param name="params[currency]" value="USD" />
    <param name="params[lang]" value="en" />
    <param name="params[email]" value="" />
    <param name="params[phone]" value="" />
    <param name="params[fee]" value="0.05" />
    <param name="params[response_url]" value="https://example.com/" />
    <param name="view[lang][]" value="en" />
    <param name="view[lang][]" value="ru" />
    <param name="view[lang][]" value="uk" />
    <param name="view[header][logo]" value="https://i.imgur.com/aUQyJcQ.png" />
    <param name="view[header][title]" value="My Amazon Shop" />
    <param name="view[header][desc]" value="Traditional Laptops" />
    <param name="view[header][url]" value="https://example.com/" />
    <param name="view[product][name]" value="Apple MacBook Pro" />
    <param name="view[product][desc]" value="Apple MacBook Pro MF841LL Laptop with Retina Display" />
    <param name="view[product][image]" value="https://i.imgur.com/gLnKFyt.png" />
    <param name="view[product][url]" value="http://amzn.to/2BVaAQ5" />
    <param name="view[field][amount]" value="" />
    <param name="view[field][email]" value="1" />
    <param name="view[field][phone]" value="1" />
    <param name="view[methods]" value="card,p24,paypal" />
</div>
<script src="https://unpkg.com/fondy-checkout@latest/dist/i18n/en.js"></script>
<script src="https://unpkg.com/fondy-checkout@latest/dist/i18n/ru.js"></script>
<script src="https://unpkg.com/fondy-checkout@latest/dist/i18n/uk.js"></script>
<script src="https://unpkg.com/fondy-checkout@latest/dist/js/checkout.js"></script>
</body>
</html>
```

<p align="center">
    <img src="https://image.prntscr.com/image/0KJQnJALT0WgVMi9PaDoPA.png">
</p>