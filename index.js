var globalCategories = [];

function createSelectElement(className, onchange) {
  const select = document.createElement("select");
  select.classList.add(className);
  select.addEventListener("change", onchange);
  return select;
}

function createOptionElement(value, text) {
  const option = document.createElement("option");
  option.value = value;
  option.text = text;
  return option;
}

function addOptionToSelectElement(selectElement, categories) {
  for (const category of categories) {
    selectElement.add(
      createOptionElement(category.category_id, category.display_category_name)
    );
  }

  return selectElement;
}

// Create Category Selector as long as the category has children and the parent category id is not 0
function createCategorySelector(categories, parentSelector) {
  if (!categories || categories.length === 0) {
    return;
  }

  const select = createSelectElement("category-select", function () {
    const categoryId = parseInt(this.value);

    const category = categories.find((c) => c.category_id === categoryId);

    // Remove any child select elements
    let nextSibling = select.nextSibling;
    while (nextSibling) {
      if (nextSibling.tagName === "SELECT") {
        nextSibling.remove();
      }
      nextSibling = nextSibling.nextSibling;
    }

    if (category.has_children) {
      const childFromGlobal = globalCategories.filter(
        (c) => c.parent_category_id === category.category_id
      );

      createCategorySelector(childFromGlobal, select.parentElement);
    }
  });

  // Default value of the select element
  select.add(createOptionElement("", "-"));

  addOptionToSelectElement(select, categories);

  // Add the select element to the parent element
  parentSelector.appendChild(select);

  // Create a child select element for the first subcategory
  const firstCategoryId = parseInt(select.options[1].value);
  const firstCategory = categories.find(
    (c) => c.category_id === firstCategoryId
  );
  if (firstCategory && firstCategory.has_children) {
    const childCategories = categories.filter(
      (c) => c.parent_category_id === firstCategoryId
    );
    createCategorySelector(childCategories, select.parentNode);
  }
}

async function getCategoryData() {
  const response = await fetch("category.json");
  const data = await response.json();
  globalCategories = data.category_list;
  return data;
}

const category = await getCategoryData();
const categoryData = category.category_list;

const mainCategories = categoryData.filter((c) => c.parent_category_id === 0);

// Create the initial select element for the main categories
const mainSelect = createSelectElement("category-select", function () {
  const categoryId = parseInt(this.value);

  const category = mainCategories.find((c) => c.category_id === categoryId);

  // Create select elements for the subcategories of the selected main category
  if (category.has_children) {
    const subcategories = categoryData.filter(
      (c) => c.parent_category_id === categoryId
    );
    createCategorySelector(subcategories, this.parentNode);
  }
});

// Default value of the select element
mainSelect.add(createOptionElement("", "-"));

addOptionToSelectElement(mainSelect, mainCategories);

// Add the main select element to the page
const categoryContainer = document.getElementById("category-selectors");
categoryContainer.appendChild(mainSelect);
