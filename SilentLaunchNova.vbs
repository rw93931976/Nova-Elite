Set objShell = WScript.CreateObject("WScript.Shell")
If WScript.Arguments.Count > 0 Then
    objShell.Run WScript.Arguments(0), 0, False
End If
