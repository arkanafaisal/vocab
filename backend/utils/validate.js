export function validate(schema, body){
    const {error, value} = schema.validate(body)
    if(error){return {ok:false, message: error.details[0].message}}
    return {ok: true, value}
}