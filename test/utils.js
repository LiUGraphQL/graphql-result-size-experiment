/**
 * Basic function for calculating the size of a GraghQL response object as
 * a number of symbols. The function should only be used as a way of verifying
 * the size calculated by the queryCalculator and does not implement the algorithm
 * referenced as part of that work.
 * 
 * @param  {object} result         string or JSON object that represents a query results
 * @return {object}                returns the size of the result
 */
function calculateResultSize(result){
    if(typeof result == 'object'){
        result = JSON.stringify(result);
    }
    result = result.substring(1,result.length-1);
    // strings
    result = result.replace(/".+?"/g, 'S');
    // numbers
    result = result.replace(/[0-9]*\.?[0-9]+/g, 'N');
    // spaces
    result = result.replace(/\s+/g, '');
    // null
    result = result.replace(/null/g, '0');
    return result.length;
}

export { calculateResultSize };