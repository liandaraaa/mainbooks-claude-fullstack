from playwright.sync_api import sync_playwright
import time, os

BASE = 'https://mainbooks-storeapp.vercel.app'
OUT  = './screenshots'
os.makedirs(OUT, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=False)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 800})
    page = ctx.new_page()

    # Homepage
    page.goto(BASE); time.sleep(2)
    page.screenshot(path=f'{OUT}/01_homepage.png')

    # Login
    page.goto(f'{BASE}/login'); time.sleep(1)
    page.screenshot(path=f'{OUT}/02_login.png')

    # Login free user
    page.fill('input[type=email]', 'user@mainbooks.id')
    page.fill('input[type=password]', 'password123')
    page.click('button[type=submit]')
    time.sleep(2)
    page.screenshot(path=f'{OUT}/03_books_free.png')

    # Book detail OTP
    page.goto(f'{BASE}/books/10000000-0000-0000-0000-000000000003'); time.sleep(2)
    page.screenshot(path=f'{OUT}/04_book_detail_otp.png')

    # Login premium
    page.goto(f'{BASE}/login'); time.sleep(1)
    page.fill('input[type=email]', 'premium@mainbooks.id')
    page.fill('input[type=password]', 'password123')
    page.click('button[type=submit]')
    time.sleep(2)
    page.screenshot(path=f'{OUT}/05_books_premium.png')

    # My Library
    page.goto(f'{BASE}/my-library'); time.sleep(2)
    page.screenshot(path=f'{OUT}/06_my_library.png')

    # Admin
    page.goto(f'{BASE}/login'); time.sleep(1)
    page.fill('input[type=email]', 'admin@mainbooks.id')
    page.fill('input[type=password]', 'admin123')
    page.click('button[type=submit]')
    time.sleep(1)
    page.goto(f'{BASE}/admin'); time.sleep(2)
    page.screenshot(path=f'{OUT}/07_admin_panel.png')

    # Admin modal
    page.click('text=+ Tambah Buku'); time.sleep(1)
    page.screenshot(path=f'{OUT}/08_admin_add_book.png')

    browser.close()
    print('Done! Screenshots saved to ./screenshots/')