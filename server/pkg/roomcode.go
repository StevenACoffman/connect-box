package server

import (
	"math/rand/v2"
	"strings"
)

const (
	AAAA        int32 = 18279
	ZZZZ        int32 = 475254
	RoomCodeLen int32 = 456975 // ZZZZ - AAAA
)

func getRandRoomNumber() int32 {
	for {
		// rand.Int32N returns a random int n, 0 <= n < RoomCodeLen.
		num := rand.Int32N(RoomCodeLen) + AAAA

		if _, ok := BadRoomCodes[num]; !ok {
			return num
		}
	}
}

func IntToLetters(number int32) string {
	number--
	letters := ""
	if firstLetter := number / 26; firstLetter > 0 {
		letters += IntToLetters(firstLetter)
		letters += string('A' + number%26)
	} else {
		letters += string('A' + number)
	}
	return letters
}

func LettersToInt(letters string) int32 {
	var val int32
	letters = strip(strings.ToUpper(letters))
	end := len(letters)
	for i, letter := range []rune(letters) {
		val += (letter - int32('A') + 1) * IntPow(26, int32(end-i-1))
	}
	return val
}

func strip(s string) string {
	var result strings.Builder
	for i := 0; i < len(s); i++ {
		b := s[i]
		if 'A' <= b && b <= 'Z' {
			result.WriteByte(b)
		}
	}
	return result.String()
}

func IntPow(base, exp int32) int32 {
	var result int32 = 1
	for {
		if exp&1 == 1 {
			result *= base
		}
		exp >>= 1
		if exp == 0 {
			break
		}
		base *= base
	}

	return result
}

var BadRoomCodes = map[int32]bool{
	18995:  true,
	26001:  true,
	27078:  true,
	27605:  true,
	29772:  true,
	30243:  true,
	35885:  true,
	36302:  true,
	36342:  true,
	43677:  true,
	45632:  true,
	45634:  true,
	45663:  true,
	45684:  true,
	49830:  true,
	49888:  true,
	58184:  true,
	58384:  true,
	59013:  true,
	61094:  true,
	62957:  true,
	63272:  true,
	64938:  true,
	67275:  true,
	67302:  true,
	67308:  true,
	71177:  true,
	71332:  true,
	73714:  true,
	73881:  true,
	74212:  true,
	76477:  true,
	76522:  true,
	76537:  true,
	76679:  true,
	76763:  true,
	76965:  true,
	80815:  true,
	80865:  true,
	83025:  true,
	84840:  true,
	87495:  true,
	106620: true,
	108880: true,
	112013: true,
	113973: true,
	116069: true,
	119741: true,
	119957: true,
	126568: true,
	126785: true,
	129548: true,
	133573: true,
	135595: true,
	140363: true,
	140364: true,
	141701: true,
	144045: true,
	144120: true,
	144312: true,
	150815: true,
	150897: true,
	151065: true,
	151101: true,
	151123: true,
	151149: true,
	151221: true,
	151227: true,
	151230: true,
	165775: true,
	171790: true,
	176545: true,
	179296: true,
	182027: true,
	182033: true,
	182351: true,
	182546: true,
	190157: true,
	199711: true,
	199744: true,
	199795: true,
	203565: true,
	203880: true,
	205546: true,
	207889: true,
	207916: true,
	210527: true,
	211826: true,
	214994: true,
	217145: true,
	217359: true,
	229521: true,
	232396: true,
	234890: true,
	238799: true,
	238939: true,
	242846: true,
	243068: true,
	247425: true,
	252337: true,
	252348: true,
	256605: true,
	260369: true,
	260551: true,
	275846: true,
	275991: true,
	276015: true,
	282187: true,
	282557: true,
	284685: true,
	285086: true,
	287181: true,
	287187: true,
	287611: true,
	287654: true,
	287813: true,
	287949: true,
	291577: true,
	291760: true,
	291762: true,
	291838: true,
	293621: true,
	293793: true,
	295469: true,
	295520: true,
	295703: true,
	295925: true,
	295931: true,
	313235: true,
	317465: true,
	320221: true,
	330918: true,
	336005: true,
	336018: true,
	336531: true,
	337973: true,
	339385: true,
	339398: true,
	339400: true,
	339606: true,
	340117: true,
	341939: true,
	342104: true,
	342622: true,
	343298: true,
	343818: true,
	344997: true,
	345001: true,
	345005: true,
	345014: true,
	348229: true,
	352358: true,
	352567: true,
	352668: true,
	354946: true,
	358143: true,
	366188: true,
	367114: true,
	392826: true,
	405299: true,
	408150: true,
	409910: true,
	409916: true,
	410062: true,
	418957: true,
}
