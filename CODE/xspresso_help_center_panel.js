// Xspresso Help Center Panel
// UI component for help/search articles, FAQs, and simple support topics.

export default function HelpCenterPanel({ articles }) {
  return `
    <div class="help-center-panel">
      <h2>Help Center</h2>
      <input type="text" placeholder="Search help..." oninput="filterHelpArticles(this.value)" />
      <ul>
        ${articles.map(
          a => `<li><strong>${a.title}</strong><div>${a.content.slice(0,100)}...</div></li>`
        ).join('')}
      </ul>
      <div class="help-footer">
        Can't find the answer? <a href="#support">Contact support</a>
      </div>
    </div>
  `;
}
