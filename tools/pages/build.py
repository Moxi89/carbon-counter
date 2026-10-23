#!/usr/bin/env python3
"""Build the site's standing pages: About, Contact, Privacy policy and Terms of use.

    python3 tools/pages/build.py

Settings come from tools/site_config.json:
  - contact_email: shown on Contact, About, Privacy and Terms
  - ads.enabled: when true, Privacy and Terms gain the advertising sections that
    Google AdSense requires (cookies, Google as a third-party vendor, opt-out,
    consent in the EEA/UK/Switzerland). Keep it false until ads actually run,
    so the policies stay accurate.
"""
import json
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
STATIC = os.path.join(ROOT, 'static')
SITE = 'https://www.carbonemissionscounter.com'
CONFIG = json.load(open(os.path.join(ROOT, 'tools', 'site_config.json'), encoding='utf-8'))
EMAIL = CONFIG['contact_email']
ADS = CONFIG['ads']['enabled']
UPDATED = ('2026-10-23', '23 October 2026')

ASSETS = {
    'styles': '2026-10b', 'theme': '2026-10l', 'post': '2026-10e',
    'nav': '2026-10e', 'footer': '2026-10j',
}


def mailto(text=None):
    return f'<a href="mailto:{EMAIL}">{text or EMAIL}</a>'


def page(slug, title, desc, h1, tag, dek, body, schema_type='WebPage'):
    url = f'{SITE}/{slug}'
    crumbs = json.dumps({'@context': 'https://schema.org', '@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': SITE + '/'},
        {'@type': 'ListItem', 'position': 2, 'name': h1, 'item': url}]}, ensure_ascii=False)
    main = json.dumps({'@context': 'https://schema.org', '@type': schema_type, 'name': h1, 'url': url,
                       'description': desc, 'dateModified': UPDATED[0],
                       'isPartOf': {'@type': 'WebSite', 'name': 'Carbon Emissions Counter', 'url': SITE + '/'},
                       'publisher': {'@type': 'Organization', 'name': 'Carbon Emissions Counter', 'url': SITE + '/',
                                     'email': EMAIL}}, ensure_ascii=False)
    a = ASSETS
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <meta name="description" content="{desc}">
    <meta name="robots" content="index, follow">
    <link rel="canonical" href="{url}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="{url}">
    <meta property="og:title" content="{title}">
    <meta property="og:description" content="{desc}">
    <meta property="og:site_name" content="Carbon Emissions Counter">
    <meta property="og:image" content="{SITE}/og/home.jpg">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="theme-color" content="#050b09">
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <link rel="icon" type="image/png" href="/favicon.png">
    <link rel="apple-touch-icon" href="/apple-touch-icon.png">
    <link rel="stylesheet" href="/css/styles.css?v={a['styles']}">
    <link rel="stylesheet" href="/shared/nav-styles.css">
    <link rel="stylesheet" href="/css/theme-2026.css?v={a['theme']}">
    <link rel="stylesheet" href="/css/post-2026.css?v={a['post']}">
    <script type="application/ld+json">{crumbs}</script>
    <script type="application/ld+json">{main}</script>
</head>
<body>
    <div class="container">
        <div id="navbar-placeholder"></div>
        <main role="main" class="bp-main">
            <nav class="bp-crumbs" aria-label="Breadcrumb"><a href="/">Home</a><span aria-hidden="true">/</span><span aria-current="page">{h1}</span></nav>
            <article class="bp-article">
                <header class="bp-header">
                    <p class="bp-tag">{tag}</p>
                    <h1 class="bp-title">{h1}</h1>
                    <p class="bp-dek">{dek}</p>
                    <p class="bp-meta"><time datetime="{UPDATED[0]}">Updated {UPDATED[1]}</time></p>
                </header>
                <div class="bp-body">
{body}
                </div>
            </article>
        </main>
        <div id="footer-placeholder"></div>
    </div>
    <script src="/shared/nav.js?v={a['nav']}" defer></script>
    <script src="/shared/footer.js?v={a['footer']}" defer></script>
</body>
</html>
'''


def sec(h, *lines, sid=None):
    ident = f' id="{sid}"' if sid else ''
    return (f'                    <section{ident}>\n                        <h2>{h}</h2>\n'
            + '\n'.join('                        ' + l for l in lines) + '\n                    </section>')


# ---------------------------------------------------------------------------
# About
# ---------------------------------------------------------------------------

about = [
    sec('What this site is',
        '<p><strong>Carbon Emissions Counter</strong> turns the world&rsquo;s most trusted emissions data into numbers you can watch change: a <a href="/">live global CO&#8322; counter</a>, the shrinking 1.5&nbsp;&deg;C carbon budget, <a href="/co2-emissions-by-country">CO&#8322; emissions for 213 countries</a>, a <a href="/blog/posts/carbon-footprint-calculator-guide#fpCalc">carbon footprint calculator</a> and practical, sourced <a href="/blog/">guides</a>.</p>',
        '<p>It is built for anyone who wants to understand the scale of emissions quickly: students and teachers, journalists, people checking their own footprint, and organisations starting to <a href="/carbon-tracking-guide">track their emissions</a>.</p>'),
    sec('Who runs it',
        '<p>Carbon Emissions Counter is an independent project. It is not affiliated with any company, government, political party or campaign, and it does not sell products or services.</p>',
        f'<p>You can reach the team at {mailto()} or through the <a href="/contact">contact page</a>.</p>'),
    sec('Where the numbers come from',
        '<ul>',
        '    <li><strong>Global totals and the carbon budget:</strong> the <a href="https://globalcarbonbudget.org/" rel="noopener">Global Carbon Budget</a>, the annual assessment by more than 100 scientists, and the <em>Indicators of Global Climate Change</em> report.</li>',
        '    <li><strong>Country data:</strong> <a href="https://ourworldindata.org/co2-emissions" rel="noopener">Our World in Data</a>, which publishes the Global Carbon Project&rsquo;s national figures under the CC&nbsp;BY&nbsp;4.0 licence.</li>',
        '    <li><strong>Emission factors</strong> in the calculator and guides: national statistics agencies such as the UK government&rsquo;s greenhouse gas conversion factors, the US EPA, Ember and the IEA.</li>',
        '</ul>',
        '<p>The live counters spread annual totals evenly over the year, so they show estimates, not live measurements. <a href="/methodology">How the counter works</a> sets out every formula and its uncertainty.</p>'),
    sec('Editorial standards',
        '<ul class="checklist">',
        '    <li><strong>Primary sources first.</strong> Figures come from the original publisher (scientific assessments, statistics agencies, peer-reviewed papers) and every article lists its sources.</li>',
        '    <li><strong>Every number is checked</strong> against its source before publishing. If a figure can&rsquo;t be verified, it is left out.</li>',
        '    <li><strong>Dated and updated.</strong> Each page shows when it was last updated. Figures are refreshed each year when the new Global Carbon Budget is published, usually in November.</li>',
        '    <li><strong>Calm and precise.</strong> No hype or scare tactics: we explain what the data shows, including its uncertainty.</li>',
        '</ul>',
        sid='editorial'),
    sec('Corrections',
        f'<p>If you spot a mistake, please email {mailto()} with the page and what is wrong. We check every report against the source, fix confirmed errors promptly and note significant corrections on the page.</p>',
        sid='corrections'),
    sec('Independence and funding',
        '<p>The site is free to use and has no paywall, accounts or affiliate links. '
        + ('It is funded by advertising served by Google AdSense. Advertisers have no influence over our content, data or conclusions, and ads are always clearly labelled.'
           if ADS else
           'It currently shows no advertising. If that changes, ads will be clearly labelled, advertisers will have no influence over our content, and our <a href="/privacy">privacy policy</a> will be updated first.')
        + '</p>',
        sid='funding'),
    sec('Reusing our work',
        '<p>You are welcome to quote our figures and text with a link to the page you used. Teachers, students and journalists can <a href="/#about-section">copy a ready-made citation</a> from the home page, and any website can embed the <a href="/widget">free live counter widget</a>. See the <a href="/terms">terms of use</a> for details.</p>'),
]

# ---------------------------------------------------------------------------
# Contact
# ---------------------------------------------------------------------------

contact = [
    sec('Email',
        f'<div class="callout"><strong>Email us:</strong> {mailto()}</div>',
        '<p>We read every message. We can&rsquo;t promise a personal reply to everything, but corrections and data questions always get a response.</p>'),
    sec('What to contact us about',
        '<ul>',
        '    <li><strong>Corrections:</strong> tell us the page and the figure, ideally with a source. See our <a href="/about#corrections">corrections policy</a>.</li>',
        '    <li><strong>Data and method questions:</strong> first check <a href="/methodology">how the counter works</a>, which covers most of them.</li>',
        '    <li><strong>Press, education and reuse:</strong> you don&rsquo;t need permission to quote figures with a link; see the <a href="/terms">terms of use</a> and the <a href="/widget">embeddable widget</a>.</li>',
        '    <li><strong>Privacy requests:</strong> see the <a href="/privacy">privacy policy</a>.</li>',
        '</ul>'),
    sec('What we can&rsquo;t help with',
        '<p>We don&rsquo;t offer consulting, carbon audits or offsets, and we don&rsquo;t accept paid articles or link placements.</p>'),
]

# ---------------------------------------------------------------------------
# Privacy
# ---------------------------------------------------------------------------

if ADS:
    privacy_dek = 'What happens to your data when you visit, including the cookies used by our advertising partner, Google.'
    privacy = [
        sec('The short version',
            '<div class="callout"><strong>In short:</strong> no accounts and no forms. The counters and the footprint calculator run in your browser. We show ads from Google, which uses cookies; in the EEA, the UK and Switzerland we ask for your consent first, and you can change your choice at any time.</div>'),
        sec('What we collect',
            '<p>We do not ask for or store personal information. There are no sign-ups, forms or newsletters.</p>',
            '<ul>',
            '    <li><strong>Server logs.</strong> Our hosting provider (Cloudflare) processes technical data such as your IP address, browser type and the pages requested, to deliver the site and protect it from abuse.</li>',
            '    <li><strong>Page-view statistics.</strong> We use Cloudflare Web Analytics, which counts visits in aggregate without cookies and without following you across websites.</li>',
            '    <li><strong>Things you type.</strong> Your birth year in the lifetime tool and your answers in the calculator stay in your browser. If you share a result, only the link you choose to share contains them.</li>',
            '</ul>'),
        sec('Advertising and cookies',
            '<p>We use <strong>Google AdSense</strong> to show ads. Google and its partners, as third-party vendors, use cookies and similar technologies to serve ads based on your previous visits to this site and other websites, to measure ads and to prevent fraud.</p>',
            '<ul>',
            '    <li>Google&rsquo;s use of advertising cookies enables it and its partners to serve ads to you based on your visits to this and other sites. Learn more in <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">how Google uses information from sites that use its services</a>.</li>',
            '    <li>You can opt out of personalised advertising in <a href="https://adssettings.google.com/" rel="noopener">Google&rsquo;s Ads Settings</a>, or opt out of some third-party vendors&rsquo; use of cookies at <a href="https://www.aboutads.info/choices/" rel="noopener">aboutads.info</a>.</li>',
            '    <li><strong>Consent in the EEA, the UK and Switzerland.</strong> Visitors there see a consent message from a Google-certified consent management platform before any advertising cookies are used. You can change your choice at any time with the privacy settings link shown on the page.</li>',
            '</ul>',
            '<p>Advertisers never receive information that identifies you from us, and they have no influence over our content.</p>'),
        sec('Services we use',
            '<ul>',
            '    <li><strong>Cloudflare:</strong> hosting, content delivery, security and privacy-friendly page-view statistics.</li>',
            '    <li><strong>Google AdSense:</strong> advertising (see above).</li>',
            '    <li><strong>GitHub:</strong> storage of the website&rsquo;s source code. No visitor data is stored there.</li>',
            '</ul>'),
        sec('Your rights',
            f'<p>Depending on where you live, you may have the right to access, correct or delete personal data, and to object to or restrict its use. For data held by Google, use your Google account or the links above. For anything else, email {mailto()}. If you are in the EU or UK, you can also complain to your data protection authority.</p>'),
        sec('Children',
            '<p>This site is suitable for all ages, and we do not knowingly collect personal information from children.</p>'),
        sec('Changes to this policy',
            '<p>If our practices change, we update this page and the date at the top.</p>'),
    ]
else:
    privacy_dek = 'We collect as little as possible: no accounts, no cookies, no ads and no tracking scripts.'
    privacy = [
        sec('The short version',
            '<div class="callout"><strong>In short:</strong> no accounts, no cookies, no advertising, no tracking scripts. The counters and the footprint calculator run in your browser, and nothing you type is sent to us.</div>'),
        sec('What we collect',
            '<p>We do not ask for, collect or store personal information. There are no sign-ups, forms or newsletters.</p>',
            '<ul>',
            '    <li><strong>Server logs.</strong> Like any website, our hosting provider (Cloudflare) processes technical data such as your IP address, browser type and the pages requested, so it can deliver the site and protect it from abuse. We don&rsquo;t use these logs to identify you.</li>',
            '    <li><strong>Page-view statistics.</strong> We use Cloudflare Web Analytics, which counts visits in aggregate without cookies and without following you across websites.</li>',
            '    <li><strong>Things you type.</strong> Your birth year in the lifetime tool and your answers in the footprint calculator stay in your browser. If you share a result, only the link you choose to share contains them.</li>',
            '</ul>'),
        sec('Cookies',
            '<p>This website does not set cookies, so there is no cookie banner. The embeddable counter widget does not set cookies either. If this ever changes, for example if we start showing ads, we will update this page first and ask for your consent where the law requires it.</p>'),
        sec('Services we use',
            '<ul>',
            '    <li><strong>Cloudflare:</strong> hosting, content delivery, security and privacy-friendly page-view statistics.</li>',
            '    <li><strong>GitHub:</strong> storage of the website&rsquo;s source code. No visitor data is stored there.</li>',
            '</ul>',
            '<p>We do not use advertising networks, and we never sell or share data.</p>'),
        sec('Your rights',
            f'<p>Because we don&rsquo;t hold personal data about you, there is normally nothing to access, correct or delete. If you have a question, email {mailto()}. If you are in the EU or UK you also have the right to complain to your data protection authority. Children can use the site safely: it collects nothing from them.</p>'),
        sec('Changes to this policy',
            '<p>If our practices change, we will update this page and the date at the top.</p>'),
    ]

# ---------------------------------------------------------------------------
# Terms
# ---------------------------------------------------------------------------

terms = [
    sec('Using this site',
        '<p>Carbon Emissions Counter is a free, independent information site. By using it you agree to these terms. If you don&rsquo;t agree, please don&rsquo;t use the site.</p>'),
    sec('Estimates, not measurements',
        '<p>The counters are estimates calculated from published annual data, mainly the Global Carbon Budget and Our World in Data. They are not live measurements, and like all emissions data they carry uncertainty. <a href="/methodology">How the counter works</a> explains the method and its limits.</p>',
        '<p>Everything on the site is for information and education. We work to keep it accurate, but we can&rsquo;t guarantee it is complete or error-free, so please check primary sources before relying on a figure for an important decision.</p>'),
    sec('Sharing and reusing our content',
        '<ul class="checklist">',
        '    <li><strong>Quote, cite and share freely.</strong> You may quote our text and figures and share screenshots and links, as long as you credit <a href="/">Carbon Emissions Counter</a> with a link.</li>',
        '    <li><strong>Embed the counter.</strong> The <a href="/widget">counter widget</a> is free for any website. Please keep its credit link.</li>',
        '    <li><strong>Underlying data.</strong> The emissions data comes from Our World in Data and the Global Carbon Project under the Creative Commons BY 4.0 licence, so you can use it directly from them.</li>',
        '</ul>',
        '<p>Please don&rsquo;t republish whole articles or copy the site&rsquo;s design or branding without permission.</p>'),
] + ([sec('Advertising',
          '<p>The site is funded by advertising from Google AdSense. Ads are clearly labelled and chosen by Google, not by us; showing an ad is not an endorsement. Advertisers have no influence over our content. See the <a href="/privacy">privacy policy</a> for how ads use cookies.</p>')] if ADS else []) + [
    sec('Fair use of the site',
        '<p>Don&rsquo;t try to disrupt the site, overload it with automated requests or gain unauthorised access to it.</p>'),
    sec('Links to other websites',
        '<p>We link to sources and other useful sites. We aren&rsquo;t responsible for their content or their privacy practices.</p>'),
    sec('Availability and liability',
        '<p>The site is provided &ldquo;as is&rdquo;. We aim to keep it online but can&rsquo;t promise it will always be available. To the maximum extent permitted by law, we are not liable for any loss arising from your use of the site or reliance on its content.</p>'),
    sec('Changes and contact',
        f'<p>We may update these terms. The date at the top shows the latest version, and continuing to use the site means you accept the current terms. Questions: {mailto()}. See also our <a href="/privacy">privacy policy</a>.</p>'),
]

PAGES = {
    'about': ('About Carbon Emissions Counter: Data, Standards, Team',
              'Who runs Carbon Emissions Counter, where every number comes from, our editorial standards and corrections policy, and how the site is funded.',
              'About Carbon Emissions Counter', 'About',
              'An independent site that turns trusted emissions data into numbers you can watch change. Here is who we are, how we work and how we&rsquo;re funded.',
              about, 'AboutPage'),
    'contact': ('Contact Carbon Emissions Counter',
                'How to contact Carbon Emissions Counter about corrections, data questions, press and reuse of our figures, the live counter widget or privacy.',
                'Contact us', 'Contact',
                'Corrections, data questions, press and reuse: here is how to reach us.',
                contact, 'ContactPage'),
    'privacy': ('Privacy Policy | Carbon Emissions Counter',
                ('How Carbon Emissions Counter handles your data, including the advertising cookies used by Google AdSense and how to opt out.' if ADS else
                 'Carbon Emissions Counter sets no cookies, runs no tracking or ads and collects no personal data. Here is exactly what happens when you visit.'),
                'Privacy policy', 'Legal', privacy_dek, privacy, 'WebPage'),
    'terms': ('Terms of Use | Carbon Emissions Counter',
              'Terms of use for Carbon Emissions Counter: how the estimates should be used, how to cite and share our content, and how to embed the free counter.',
              'Terms of use', 'Legal',
              'Plain-English terms: what the numbers are, how you can reuse them, and our limits of responsibility.',
              terms, 'WebPage'),
}


def main():
    for slug, (title, desc, h1, tag, dek, secs, stype) in PAGES.items():
        with open(os.path.join(STATIC, slug + '.html'), 'w', encoding='utf-8') as f:
            f.write(page(slug, title, desc, h1, tag, dek, '\n\n'.join(secs), stype))
    print(f'pages: {", ".join(PAGES)} (ads {"on" if ADS else "off"}, contact {EMAIL})')


if __name__ == '__main__':
    main()
