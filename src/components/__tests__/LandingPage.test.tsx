import { expect, test, vi, beforeEach, describe } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TranslationProvider } from '@/i18n/index';
import LandingPage from '../LandingPage';

describe('LandingPage', () => {
  let mockOnGetStarted: ReturnType<typeof vi.fn>;
  let mockOnSignIn: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnGetStarted = vi.fn();
    mockOnSignIn = vi.fn();
    localStorage.clear();
  });

  const renderLanding = () =>
    render(
      <TranslationProvider>
        <LandingPage onGetStarted={mockOnGetStarted} onSignIn={mockOnSignIn} />
      </TranslationProvider>,
    );

  test('renders hero CTAs and fires onGetStarted when primary button clicked', () => {
    renderLanding();

    // Find primary CTA button in hero section (first one)
    const primaryButtons = screen.getAllByRole('button', { name: /Jadvalni bepul yarating|Create free schedule/ });
    const heroButton = primaryButtons[0];

    expect(heroButton).toBeInTheDocument();
    fireEvent.click(heroButton);
    expect(mockOnGetStarted).toHaveBeenCalledTimes(1);
  });

  test('fires onSignIn when nav Kirish ghost button clicked', () => {
    renderLanding();

    // Find the desktop nav Kirish button (in the navbar area)
    const navButtons = screen.getAllByRole('button');
    const signInButton = navButtons.find(btn =>
      btn.textContent === 'Kirish' && btn.className.includes('lp-nav-link')
    );

    expect(signInButton).toBeInTheDocument();
    fireEvent.click(signInButton!);
    expect(mockOnSignIn).toHaveBeenCalledTimes(1);
  });

  test('renders all 4 nav sections and 3 pricing tiers with MINI "Ko\'p tanlanadi" badge', () => {
    renderLanding();

    // Check nav links: Afzalliklar, Integratsiyalar, Narxlar, Savollar
    const links = screen.getAllByRole('link');
    const navLabels = ['Afzalliklar', 'Integratsiyalar', 'Narxlar', 'Savollar'];
    for (const label of navLabels) {
      expect(links.some(link => link.textContent?.includes(label))).toBe(true);
    }

    // Check pricing tier names: Free, Mini, Max (using queryAllByText to handle multiples)
    const freeTexts = screen.queryAllByText('Free');
    const miniTexts = screen.queryAllByText('Mini');
    const maxTexts = screen.queryAllByText('Max');
    expect(freeTexts.length).toBeGreaterThan(0);
    expect(miniTexts.length).toBeGreaterThan(0);
    expect(maxTexts.length).toBeGreaterThan(0);

    // Check "Ko'p tanlanadi" badge on Mini
    expect(screen.queryByText(/Ko'p tanlanadi/i)).toBeInTheDocument();
  });

  test('FAQ accordion opens item when trigger clicked', () => {
    renderLanding();

    // Find the first FAQ trigger by its question text
    const triggers = screen.getAllByRole('button', { name: /Maktab ma'lumotlari xavfsizmi/i });
    const firstTrigger = triggers[0];

    expect(firstTrigger).toBeInTheDocument();

    // Initially, the answer should not be visible in the DOM or accessible
    // (Radix accordion controls visibility)
    fireEvent.click(firstTrigger);

    // After clicking, the answer text should become visible
    const answerText = screen.getByText(/Barcha ma'lumotlar shifrlangan holda saqlanadi/);
    expect(answerText).toBeInTheDocument();
  });

  test('language switch: clicking EN swaps nav copy from Uzbek', () => {
    renderLanding();

    // Verify initial Uzbek text is visible
    let links = screen.getAllByRole('link');
    let hasUzbek = links.some(link => link.textContent?.includes('Afzalliklar'));
    expect(hasUzbek).toBe(true);

    // Click EN language button - find all buttons with 'en' text (case insensitive)
    const allButtons = screen.getAllByRole('button');
    const enButton = allButtons.find(
      btn => btn.textContent?.trim().toLowerCase() === 'en'
    );
    expect(enButton).toBeDefined();
    fireEvent.click(enButton!);

    // After clicking EN, the nav links should now show English translation
    // The English translation should be different from "Afzalliklar"
    links = screen.getAllByRole('link');
    const hasEnglish = links.some(link => link.textContent?.includes('Benefits'));
    expect(hasEnglish).toBe(true);

    // The Uzbek version should no longer exist
    const hasUzbekAfter = links.some(link => link.textContent?.includes('Afzalliklar'));
    expect(hasUzbekAfter).toBe(false);
  });

  test('mobile hamburger toggles mobile menu panel', () => {
    // Render in a mobile context by checking for mobile menu
    renderLanding();

    // Find the mobile menu toggle button (should have aria-label "Toggle menu")
    const buttons = screen.getAllByRole('button');
    const hamburger = buttons.find(btn => btn.getAttribute('aria-label') === 'Toggle menu');
    expect(hamburger).toBeInTheDocument();

    // Check initial state
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');

    // Click to open mobile menu
    fireEvent.click(hamburger!);
    expect(hamburger).toHaveAttribute('aria-expanded', 'true');

    // Click to close mobile menu
    fireEvent.click(hamburger!);
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  test('accessibility smoke: no emoji chars in rendered text, no "Timetable.uz" brand reference', () => {
    renderLanding();

    // Get the entire rendered content
    const container = document.body;
    const textContent = container.textContent || '';

    // Check for emoji characters using Unicode ranges
    const emojiRegex = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    expect(emojiRegex.test(textContent)).toBe(false);

    // Check that old brand name "Timetable.uz" is not in the rendered DOM
    // (Should use E-timetable or e-timetable instead)
    // It should NOT have the exact text "Timetable.uz" as a brand name
    const hasOldBrand = textContent.includes('Timetable.uz');
    expect(hasOldBrand).toBe(false);
  });

  test('hero grid preview renders conflict SR label', () => {
    renderLanding();

    // The conflict SR label is rendered as screen reader only
    // Check for the text "Nizo avtomatik hal qilinmoqda"
    const conflictSrTexts = screen.getAllByText(/Nizo avtomatik hal qilinmoqda/);
    expect(conflictSrTexts.length).toBeGreaterThan(0);

    // Verify at least one has the sr-only class
    const hasSrOnly = conflictSrTexts.some(element =>
      element.className.includes('sr-only')
    );
    expect(hasSrOnly).toBe(true);
  });
});
