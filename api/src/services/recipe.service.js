const recipeRepository = require ('../Repository/recipe.repository');
const dietRepository = require('../Repository/diet.repository');
const axios = require('axios');


const URL = 'http://localhost:3002/api/'

//########## mapeo de datos de bd   ##########
const mapArrayBdToArrayRecipe = (data) =>{
  
  return data.map(e => mapRecipeBdToRecipe(e));
}
const mapRecipeBdToRecipe = (recipe) =>{
  return{
    id: recipe.id,
    title: recipe.title,
    image: recipe.image,
    summary: recipe.summary,
    healthScore: recipe.healthScore,
    diets: recipe.diets.map(e => e.name),
    steps: recipe.steps //.map(e => {return {numer: e.number, step: e.step}})
  }
}
//########## mapeo de recipes de api ########################
const mapArrayApiToArrayRecipe = (arrayApi) => {
  return arrayApi.map(recipe => mapApiToRecipe(recipe))
};

const mapApiToRecipe = (recipe) => {
  // dietas

  let dietsApi = new Set();
  recipe.vegetarian && dietsApi.add("vegetarian");
  recipe.vegan && dietsApi.add("vegan");
  recipe.glutenFree && dietsApi.add("gluten free");
  //se hace recorrido en diets para agregar solo aquellos que no pertenecen a dietsApi
  if (recipe.diets.length) {
    for (let diet of recipe.diets) {
      dietsApi.add(diet);
    }
  }
  //paso a paso
  let stepsApi = [];

  if (recipe.analyzedInstructions.length) {
    for (let obj of recipe.analyzedInstructions) {
      stepsApi = [...stepsApi, ...obj.steps.map(s => { return { number: s.number, step: s.step } })]
    };
  }

  return {
    id: recipe.id,
    title: recipe.title,
    healthScore: recipe.healthScore,
    image:recipe.image,
    summary: recipe.summary,
    diets: Array.from(dietsApi),
    steps: stepsApi

  }
}


const findRecipeByDiet = async (diet) =>{
  const dietId = await dietRepository.findDietByName(diet);
  const recipesId = await recipeRepository.findRecipesIdByDiet(dietId.id);
  let recipes = await recipeRepository.findRecipesByIds(recipesId);
  return recipes;
}

const getRecipesByNameOpLike = async (name) =>{
  let recipesBd = await recipeRepository.findRecipeByNameOpLike(name).then(r => mapArrayBdToArrayRecipe(r));
  let recipesApi = await axios.get(`${URL}allRecipes`)
  .then(r => r.data.results)
  .then(r => mapArrayApiToArrayRecipe(r.filter(r => r.title.includes(name))));

  return [...recipesBd, ...recipesApi];
}


const findAllRecipes = async () =>{
  const recipesBd = await recipeRepository.findAllRecipes().then(r => mapArrayBdToArrayRecipe(r));
  const recipesApi = await axios.get(`${URL}allRecipes`).then(r => mapArrayApiToArrayRecipe(r.data.results));
  return [...recipesBd, ...recipesApi]
}
module.exports = {
  findRecipeByDiet,
  getRecipesByNameOpLike,
  findAllRecipes
}