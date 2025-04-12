var memoryAllocation = 0

function initMemory()
{
  memoryAllocation = 0
}

function allocateMemory(size)
{
  if(!Number.isInteger(size))
  {
    console.log("Error: invalid allocateMemory call, size must be integer")
  }
  let returnValue = memoryAllocation
  memoryAllocation += size
  return returnValue

}

function freeMemory()
{
    // TODO: implement this
}

if (typeof window == 'undefined') {
  module.exports = {
    initMemory,
    allocateMemory,
    freeMemory
};
}