// xspresso_onboarding_welcome_screen.js
// Simple onboarding/welcome screen logic for Xspresso

export function renderOnboardingWelcomeScreen({ onSubmit }) {
  // Create the container
  const container = document.createElement('div');
  container.className = 'xspresso-onboarding-welcome';
  container.innerHTML = `
    <h1>Welcome to Xspresso</h1>
    <p class="onboarding-desc">Done-for-you marketing that gets responses. You stay in command. We do the work.</p>
    <form id="onboarding-form" autocomplete="off">
      <label for="onboarding-name">Your Name (optional):</label><br>
      <input type="text" id="onboarding-name" name="onboarding-name" placeholder="What's your name?" /><br><br>

      <label for="onboarding-goal">What is your main marketing goal?</label><br>
      <select id="onboarding-goal" name="onboarding-goal">
        <option value="">Select a goal...</option>
        <option value="leads">Get more leads</option>
        <option value="sales">Get more sales</option>
        <option value="list">Build my list</option>
        <option value="awareness">Increase awareness</option>
      </select><br><br>

      <label for="onboarding-experience">How experienced are you with marketing?</label><br>
      <select id="onboarding-experience" name="onboarding-experience">
        <option value="beginner">Beginner</option>
        <option value="some">Some experience</option>
        <option value="advanced">Advanced</option>
      </select><br><br>

      <button type="submit" class="xspresso-btn-primary">Get Started</button>
    </form>
    <div style="margin-top:20px;font-size:smaller;color:#888;">\u2615 Would you like a shot of Xspresso? Try it free for 7 days.</div>
  `;

  // Add event listener for the form
  container.querySelector('#onboarding-form').addEventListener('submit', function (e) {
    e.preventDefault();
    const name = container.querySelector('#onboarding-name').value;
    const goal = container.querySelector('#onboarding-goal').value;
    const experience = container.querySelector('#onboarding-experience').value;
    if (typeof onSubmit === 'function') {
      onSubmit({ name, goal, experience });
    }
    container.innerHTML = `<h2>Thanks, ${name ? name : 'Friend'}!</h2><p>We’ll help you get started with Xspresso.</p>`;
  });

  return container;
}
