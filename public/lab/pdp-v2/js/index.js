const dropDownOpen = () => {
  const dropDown = document.querySelector('#dropDown');
  const tableSection = document.querySelector('#tableSection');
  const detailText = document.querySelector('#detailText');

  dropDown?.classList.toggle('rotate-180');
  tableSection?.classList.toggle('hidden');

  if (detailText) {
    detailText.textContent =
      detailText.textContent.trim() === 'Hide' ? 'View' : 'Hide';
  }
};

dropDownOpenSpec = () => {
  const dropDownSpec = document.getElementById('dropDownSpec');
  dropDownSpec.classList.toggle('rotate-180');

  const tableSection = document.querySelectorAll('#specificationsTable .hc');

  tableSection.forEach(section => {
    section.classList.toggle('hidden');
  });
};

const showBottomBanner = () => {
  const addBtn = document.getElementById('addTocartButton');
  const bottomBanner = document.getElementById('bottomBanner');

  if (!addBtn || !bottomBanner) return;

  const handleScroll = () => {
    const addBtnPosition = addBtn.getBoundingClientRect().top + window.scrollY;
    const scrollPosition = window.scrollY;

    if (scrollPosition > addBtnPosition) {
      bottomBanner.classList.add('md:block');
      bottomBanner.classList.remove('md:hidden');
    } else {
      bottomBanner.classList.add('md:hidden');
      bottomBanner.classList.remove('md:block');
    }
  };
  console.log('WORKS!');
  window.addEventListener('scroll', handleScroll);
};

showBottomBanner();
