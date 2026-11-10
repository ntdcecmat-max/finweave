package test.finweave.prototype.collector

import org.json.JSONArray
import org.json.JSONObject

// Validate the pinned wire schema; never coerce values or remove unknown fields.
class ApiSchema(val contract:JSONObject) {
    fun check(name:String,value:Any?) { require(matches(contract.getJSONObject("components").getJSONObject("schemas").getJSONObject(name),value)) { "CONTRACT_INVALID" } }
    private fun scalar(v:Any?):String=if(v is Number)v.toDouble().toString() else v?.toString() ?: "null"
    private fun matches(s:JSONObject,v:Any?):Boolean {
        if(s.has("\$ref")) { var node:Any=contract;for(p in s.getString("\$ref").removePrefix("#/").split('/')) node=(node as JSONObject).get(p);return matches(node as JSONObject,v) }
        fun variants(key:String):List<JSONObject> { val a=s.optJSONArray(key) ?: return emptyList();return (0 until a.length()).map { a.getJSONObject(it) } }
        if(s.has("anyOf")&&!variants("anyOf").any { matches(it,v) })return false
        if(s.has("oneOf")&&variants("oneOf").count { matches(it,v) }!=1)return false
        if(s.has("allOf")&&!variants("allOf").all { matches(it,v) })return false
        if(s.has("const")&&scalar(s.get("const"))!=scalar(v ?: JSONObject.NULL))return false
        if(s.has("enum")){val a=s.getJSONArray("enum");if((0 until a.length()).none { scalar(a.get(it))==scalar(v ?: JSONObject.NULL) })return false}
        val type=s.opt("type");val types=if(type is JSONArray)(0 until type.length()).map { type.getString(it) } else if(type is String)listOf(type) else emptyList()
        fun isType(t:String)=when(t){"null"->v==null||v===JSONObject.NULL;"object"->v is JSONObject;"array"->v is JSONArray;"string"->v is String;"boolean"->v is Boolean;"number"->v is Number&&v.toDouble().isFinite();"integer"->v is Number&&v.toDouble().isFinite()&&v.toDouble()%1.0==0.0;else->false}
        if(types.isNotEmpty()&&types.none { isType(it) })return false
        if(v is JSONObject){val p=s.optJSONObject("properties")?:JSONObject();val r=s.optJSONArray("required");if(r!=null&&(0 until r.length()).any { !v.has(r.getString(it)) })return false
            for(k in v.keys()){val names=s.optJSONObject("propertyNames");if(names!=null&&!matches(names,k))return false;if(p.has(k)){if(!matches(p.getJSONObject(k),v.get(k)))return false}else{val extra=s.opt("additionalProperties");if(extra==false)return false;if(extra is JSONObject&&!matches(extra,v.get(k)))return false}}
        }
        if(v is JSONArray){if(v.length()<s.optInt("minItems",0)||v.length()>s.optInt("maxItems",Int.MAX_VALUE))return false;val i=s.optJSONObject("items");if(i!=null&&(0 until v.length()).any { !matches(i,v.get(it)) })return false;if(s.optBoolean("uniqueItems")&&(0 until v.length()).map { scalar(v.get(it)) }.toSet().size!=v.length())return false}
        if(v is String){val size=v.codePointCount(0,v.length);if(size<s.optInt("minLength",0)||size>s.optInt("maxLength",Int.MAX_VALUE))return false;if(s.has("pattern")&&!Regex(s.getString("pattern")).containsMatchIn(v))return false
            try {when(s.optString("format")){"date"->java.time.LocalDate.parse(v);"date-time"->java.time.OffsetDateTime.parse(v);"uri"->require(java.net.URI(v).isAbsolute);"email"->require(v.contains('@'))}}catch(_:Exception){return false}
        }
        if(v is Number){val n=v.toDouble();if(s.has("minimum")&&n<s.getDouble("minimum")||s.has("maximum")&&n>s.getDouble("maximum")||s.has("exclusiveMinimum")&&n<=s.getDouble("exclusiveMinimum"))return false}
        return true
    }
}
