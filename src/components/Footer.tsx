export function Footer() {
  return (
    <footer className="foot">
      <details>
        <summary>How it works</summary>
        <p>The planner lays out every day in your period, marking weekends, public holidays and any days you've marked yourself.
          It then weighs every way of spending your leave in runs (stretching each over the weekends and holidays either side) and picks the set of breaks that gives you the most time off.
          "A few long breaks" counts days in a row for more, so it prefers one ten-day trip over two five-day ones.</p>
        <p>Holidays follow the Public Holidays Act 36 of 1994. When a holiday lands on a Sunday, the Monday is off.
          Once-off days declared by the President (like election days) are added as they're announced. Check with your employer for anything company-specific.</p>
      </details>
      <p className="credit">Free to use, and it runs entirely in your browser. Made by <a href="https://github.com/Cade-hub" target="_blank" rel="noopener">Cade Wickham</a>.</p>
    </footer>
  );
}
